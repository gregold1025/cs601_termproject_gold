// useCharacterPhysics — the motion engine, as a thin React wrapper
// around the pure stepPhysics function.
//
// The live simulation (position + velocity) lives in refs and advances
// once per frame via stepPhysics; a snapshot is published to React
// state for rendering. All the physics MATH lives in stepPhysics.ts,
// where it's pure and tested — this hook only owns the React plumbing
// and the imperative controls (intent, jump, impulse, teleport).
//
// The character behaves identically everywhere this hook is mounted:
// the playground and the dance lab share one motion model. The lab's
// only extra rule (snap home when a move finishes and the body has
// settled) lives in the lab, built on `resting` + `teleport`.

import { useCallback, useRef, useState } from "react";
import { useGameLoop } from "./useGameLoop";
import {
  stepPhysics,
  isResting,
  PhysicsState,
  Vec2,
  PHYSICS_DEFAULTS,
} from "./stepPhysics";

export type { Vec2 };

export type PhysicsConfig = {
  gravity?: number;
  friction?: number;
  moveSpeed?: number;
  jumpSpeed?: number;
  initial?: Vec2;
  // Optional world bounds — if set, character x is clamped between
  // minX and maxX (in physics-relative coords; 0 is the starting spot).
  bounds?: { minX: number; maxX: number };
};

export type CharacterPhysics = {
  position: Vec2;
  // True when grounded, not sliding, and not falling — the "settled"
  // half of the lab's snap-home condition.
  resting: boolean;
  setMovingLeft: (moving: boolean) => void;
  setMovingRight: (moving: boolean) => void;
  jump: () => void;
  // One-shot velocity impulse (px/s), added to current velocity.
  // Impulses are additive: firing two in quick succession stacks them.
  applyImpulse: (vx: number, vy: number) => void;
  // Instantly relocate the body and zero its velocity (no physics —
  // used by the lab's snap-home reset).
  teleport: (x: number, y: number) => void;
};

export function useCharacterPhysics(
  config: PhysicsConfig = {},
): CharacterPhysics {
  const jumpSpeed = config.jumpSpeed ?? PHYSICS_DEFAULTS.jumpSpeed;
  const initial = config.initial ?? { x: 0, y: 0 };

  const world = {
    gravity: config.gravity ?? PHYSICS_DEFAULTS.gravity,
    friction: config.friction ?? PHYSICS_DEFAULTS.friction,
    moveSpeed: config.moveSpeed ?? PHYSICS_DEFAULTS.moveSpeed,
    bounds: config.bounds,
  };

  // Live simulation state — mutated every frame, never triggers renders.
  const stateRef = useRef<PhysicsState>({
    position: { ...initial },
    velocity: { x: 0, y: 0 },
  });
  const intentRef = useRef({ left: false, right: false });

  // Published snapshot — one setState per tick, drives rendering.
  const [snapshot, setSnapshot] = useState<{ position: Vec2; resting: boolean }>(
    { position: { ...initial }, resting: true },
  );

  useGameLoop((dt) => {
    stateRef.current = stepPhysics(
      stateRef.current,
      intentRef.current,
      dt,
      world,
    );
    const position = stateRef.current.position;
    const resting = isResting(stateRef.current);
    // Skip the render when nothing observable moved — at 60Hz a resting
    // character would otherwise publish an identical snapshot every tick.
    setSnapshot((prev) =>
      prev.position.x === position.x &&
      prev.position.y === position.y &&
      prev.resting === resting
        ? prev
        : { position, resting },
    );
  });

  // Stable across renders so consumers can list them in effect deps
  // without re-running every frame.
  const setMovingLeft = useCallback((moving: boolean) => {
    intentRef.current.left = moving;
  }, []);
  const setMovingRight = useCallback((moving: boolean) => {
    intentRef.current.right = moving;
  }, []);
  const jump = useCallback(() => {
    // Only jump from the ground (no double-jump yet).
    if (stateRef.current.position.y >= 0) {
      stateRef.current.velocity.y = -jumpSpeed;
    }
  }, [jumpSpeed]);
  const applyImpulse = useCallback((vx: number, vy: number) => {
    stateRef.current.velocity.x += vx;
    stateRef.current.velocity.y += vy;
  }, []);
  const teleport = useCallback((x: number, y: number) => {
    stateRef.current = { position: { x, y }, velocity: { x: 0, y: 0 } };
  }, []);

  return {
    position: snapshot.position,
    resting: snapshot.resting,
    setMovingLeft,
    setMovingRight,
    jump,
    applyImpulse,
    teleport,
  };
}
