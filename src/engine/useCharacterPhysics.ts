// useCharacterPhysics — crude 2D physics for a single character.
// Owns position + velocity + intent (movement input).
// Each tick: integrates horizontal intent into velocity, applies gravity,
// integrates velocity into position, clamps y to ground.
//
// Coordinate convention (matches CSS translate semantics):
//   x: 0 = original spot. Positive = right, negative = left.
//   y: 0 = ground. Positive = below ground (clamped). Negative = airborne.

import { useRef, useState } from "react";
import { useGameLoop } from "./useGameLoop";

export type Vec2 = { x: number; y: number };

export type PhysicsConfig = {
  gravity?: number;     // px/s^2, pulls y toward positive (down)
  friction?: number;    // per-second horizontal damping when idle
  moveSpeed?: number;   // horizontal velocity while moving
  jumpSpeed?: number;   // upward velocity applied on jump
  initial?: Vec2;
  // Optional world bounds — if set, character x is clamped between
  // minX and maxX (in physics-relative coords; 0 is the starting spot).
  bounds?: { minX: number; maxX: number };
};

export type CharacterPhysics = {
  position: Vec2;
  setMovingLeft: (moving: boolean) => void;
  setMovingRight: (moving: boolean) => void;
  jump: () => void;
  // One-shot velocity impulse (px/s), added to current velocity.
  // Impulses are additive: firing two in quick succession stacks them.
  applyImpulse: (vx: number, vy: number) => void;
};

const DEFAULTS = {
  gravity: 2200,
  friction: 8,
  moveSpeed: 280,
  jumpSpeed: 900,
};

export function useCharacterPhysics(config: PhysicsConfig = {}): CharacterPhysics {
  const gravity = config.gravity ?? DEFAULTS.gravity;
  const friction = config.friction ?? DEFAULTS.friction;
  const moveSpeed = config.moveSpeed ?? DEFAULTS.moveSpeed;
  const jumpSpeed = config.jumpSpeed ?? DEFAULTS.jumpSpeed;
  const initial = config.initial ?? { x: 0, y: 0 };

  // Refs hold the live simulation state (updated every frame).
  const positionRef = useRef<Vec2>({ ...initial });
  const velocityRef = useRef<Vec2>({ x: 0, y: 0 });
  const intentRef = useRef({ left: false, right: false });

  // State mirrors position so renders update when the character moves.
  const [position, setPosition] = useState<Vec2>({ ...initial });

  useGameLoop((dt) => {
    // Horizontal velocity follows intent. With no intent held, friction
    // decays vx — but only on the ground. Airborne horizontal velocity
    // persists, so impulse launches travel as real projectile arcs
    // instead of stalling mid-air.
    const grounded = positionRef.current.y >= 0;
    if (intentRef.current.left && !intentRef.current.right) {
      velocityRef.current.x = -moveSpeed;
    } else if (intentRef.current.right && !intentRef.current.left) {
      velocityRef.current.x = moveSpeed;
    } else if (grounded) {
      velocityRef.current.x *= Math.max(0, 1 - friction * dt);
    }

    // Gravity always pulls vy toward positive (down in CSS coords).
    velocityRef.current.y += gravity * dt;

    // Integrate velocity into position.
    positionRef.current.x += velocityRef.current.x * dt;
    positionRef.current.y += velocityRef.current.y * dt;

    // Horizontal world bounds — clamp x and zero velocity into the wall.
    if (config.bounds) {
      if (positionRef.current.x < config.bounds.minX) {
        positionRef.current.x = config.bounds.minX;
        if (velocityRef.current.x < 0) velocityRef.current.x = 0;
      } else if (positionRef.current.x > config.bounds.maxX) {
        positionRef.current.x = config.bounds.maxX;
        if (velocityRef.current.x > 0) velocityRef.current.x = 0;
      }
    }

    // Ground collision — y > 0 means below ground; clamp and zero downward vy.
    if (positionRef.current.y > 0) {
      positionRef.current.y = 0;
      if (velocityRef.current.y > 0) velocityRef.current.y = 0;
    }

    setPosition({ x: positionRef.current.x, y: positionRef.current.y });
  });

  return {
    position,
    setMovingLeft: (moving) => {
      intentRef.current.left = moving;
    },
    setMovingRight: (moving) => {
      intentRef.current.right = moving;
    },
    jump: () => {
      // Only jump from the ground (no double-jump yet).
      if (positionRef.current.y >= 0) {
        velocityRef.current.y = -jumpSpeed;
      }
    },
    applyImpulse: (vx, vy) => {
      // Additive — a move's force vector stacks onto whatever velocity
      // the character already has (mid-walk, mid-jump, mid-launch).
      // A downward impulse while grounded is absorbed by the ground
      // clamp on the next tick; airborne, it shoots the character down.
      velocityRef.current.x += vx;
      velocityRef.current.y += vy;
    },
  };
}
