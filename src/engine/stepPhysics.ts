// stepPhysics — the pure physics step.
//
// One frame of simulation as a pure function: same inputs always produce
// the same output. No React, no refs, no side effects. The hook
// (useCharacterPhysics) is a thin wrapper that calls this every tick and
// publishes the result; tests call it directly with fabricated states.
//
// Coordinate convention (matches CSS translate semantics):
//   x: 0 = origin. Positive = right, negative = left.
//   y: 0 = ground. Positive = below ground (clamped). Negative = airborne.
//
// Design notes:
//   - Friction applies only while GROUNDED. Airborne horizontal velocity
//     persists (no air resistance — a deliberate simplification). This is
//     why launch angle matters: a flat launch skids against friction the
//     whole way, while an arced launch flies friction-free — projectiles
//     have optimal launch angles here just like real ones.
//   - The ground is a single hardcoded plane at y = 0 today. The future
//     world-collision system generalizes the clamp at the bottom of this
//     function into a loop over collidable rectangles.

export type Vec2 = { x: number; y: number };

export type PhysicsState = {
  position: Vec2;
  velocity: Vec2;
};

export type PhysicsIntent = {
  left: boolean;
  right: boolean;
};

export type PhysicsWorld = {
  gravity: number; // px/s², pulls y toward positive (down)
  friction: number; // per-second horizontal damping when idle on ground
  moveSpeed: number; // horizontal velocity while a movement key is held
  bounds?: { minX: number; maxX: number };
};

export const PHYSICS_DEFAULTS = {
  gravity: 2200,
  friction: 8,
  moveSpeed: 280,
  jumpSpeed: 900,
};

// Below this horizontal speed a grounded body counts as settled.
const REST_SPEED = 0.5;

export function stepPhysics(
  state: PhysicsState,
  intent: PhysicsIntent,
  dt: number,
  world: PhysicsWorld,
): PhysicsState {
  let vx = state.velocity.x;
  let vy = state.velocity.y;
  const grounded = state.position.y >= 0;

  // Horizontal velocity follows intent; with no intent, friction decays
  // vx — but only on the ground (see header note).
  if (intent.left && !intent.right) {
    vx = -world.moveSpeed;
  } else if (intent.right && !intent.left) {
    vx = world.moveSpeed;
  } else if (grounded) {
    vx *= Math.max(0, 1 - world.friction * dt);
  }

  // Gravity always pulls down (positive y).
  vy += world.gravity * dt;

  // Integrate velocity into position.
  let x = state.position.x + vx * dt;
  let y = state.position.y + vy * dt;

  // Horizontal world bounds — clamp and zero velocity into the wall.
  if (world.bounds) {
    if (x < world.bounds.minX) {
      x = world.bounds.minX;
      if (vx < 0) vx = 0;
    } else if (x > world.bounds.maxX) {
      x = world.bounds.maxX;
      if (vx > 0) vx = 0;
    }
  }

  // Ground collision — y > 0 means below ground; clamp and zero
  // downward velocity. (The seam where world-object collision lands.)
  if (y > 0) {
    y = 0;
    if (vy > 0) vy = 0;
  }

  return { position: { x, y }, velocity: { x: vx, y: vy } };
}

// A body is at rest when it sits on the ground with no meaningful
// horizontal motion and no downward velocity (the ground clamp zeroes
// vy on contact, so a resting body always reads vy === 0 post-step).
export function isResting(state: PhysicsState): boolean {
  return (
    state.position.y >= 0 &&
    Math.abs(state.velocity.x) < REST_SPEED &&
    state.velocity.y <= 0 + 1e-9 &&
    state.velocity.y >= 0 - 1e-9
  );
}
