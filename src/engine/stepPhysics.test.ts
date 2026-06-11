// Tests for the pure physics step. These pin down the behaviors the
// rest of the system depends on: determinism, the grounded-only
// friction rule, projectile arcs, clamps, and the settled check the
// dance lab's snap-home relies on.

import {
  stepPhysics,
  isResting,
  PhysicsState,
  PhysicsWorld,
  PHYSICS_DEFAULTS,
} from "./stepPhysics";

const WORLD: PhysicsWorld = {
  gravity: PHYSICS_DEFAULTS.gravity,
  friction: PHYSICS_DEFAULTS.friction,
  moveSpeed: PHYSICS_DEFAULTS.moveSpeed,
};

const DT = 1 / 60;
const IDLE = { left: false, right: false };

const atRest = (): PhysicsState => ({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
});

// Run the sim until the body is resting again (or maxSteps elapse).
function runUntilRest(state: PhysicsState, maxSteps = 1000): PhysicsState {
  let s = state;
  for (let i = 0; i < maxSteps; i++) {
    s = stepPhysics(s, IDLE, DT, WORLD);
    if (isResting(s)) return s;
  }
  return s;
}

describe("stepPhysics", () => {
  test("is deterministic — same inputs, same output", () => {
    const state: PhysicsState = {
      position: { x: 12, y: -40 },
      velocity: { x: 100, y: -300 },
    };
    const a = stepPhysics(state, IDLE, DT, WORLD);
    const b = stepPhysics(state, IDLE, DT, WORLD);
    expect(a).toEqual(b);
  });

  test("does not mutate its input state", () => {
    const state = atRest();
    stepPhysics(state, { left: false, right: true }, DT, WORLD);
    expect(state).toEqual(atRest());
  });

  test("a resting body stays clamped on the ground", () => {
    const next = stepPhysics(atRest(), IDLE, DT, WORLD);
    expect(next.position.y).toBe(0);
    expect(next.velocity.y).toBe(0);
  });

  test("an airborne body falls (gravity pulls y toward positive)", () => {
    const state: PhysicsState = {
      position: { x: 0, y: -100 },
      velocity: { x: 0, y: 0 },
    };
    const next = stepPhysics(state, IDLE, DT, WORLD);
    expect(next.velocity.y).toBeGreaterThan(0);
    expect(next.position.y).toBeGreaterThan(-100);
  });

  test("held intent moves the body at moveSpeed", () => {
    const next = stepPhysics(atRest(), { left: false, right: true }, DT, WORLD);
    expect(next.velocity.x).toBe(WORLD.moveSpeed);
    expect(next.position.x).toBeCloseTo(WORLD.moveSpeed * DT);
  });

  test("grounded friction decays horizontal velocity when idle", () => {
    const sliding: PhysicsState = {
      position: { x: 0, y: 0 },
      velocity: { x: 400, y: 0 },
    };
    const next = stepPhysics(sliding, IDLE, DT, WORLD);
    expect(next.velocity.x).toBeLessThan(400);
    expect(next.velocity.x).toBeGreaterThan(0);
  });

  test("airborne horizontal velocity persists (no air resistance)", () => {
    const flying: PhysicsState = {
      position: { x: 0, y: -50 },
      velocity: { x: 400, y: -200 },
    };
    const next = stepPhysics(flying, IDLE, DT, WORLD);
    expect(next.velocity.x).toBe(400);
  });

  test("an upward launch arcs and returns to the ground", () => {
    const launched: PhysicsState = {
      position: { x: 0, y: 0 },
      velocity: { x: 200, y: -900 },
    };
    // It leaves the ground...
    let s = stepPhysics(launched, IDLE, DT, WORLD);
    expect(s.position.y).toBeLessThan(0);
    // ...and eventually comes to rest back on it, downrange.
    s = runUntilRest(s);
    expect(isResting(s)).toBe(true);
    expect(s.position.y).toBe(0);
    expect(s.position.x).toBeGreaterThan(0);
  });

  test("an arced launch outranges a flat launch of equal magnitude", () => {
    // The optimal-launch-angle property: friction eats the flat skid,
    // while the 45° launch flies friction-free.
    const mag = 900;
    const flat = runUntilRest({
      position: { x: 0, y: 0 },
      velocity: { x: mag, y: 0 },
    });
    const angled = runUntilRest({
      position: { x: 0, y: 0 },
      velocity: { x: mag / Math.SQRT2, y: -mag / Math.SQRT2 },
    });
    expect(angled.position.x).toBeGreaterThan(flat.position.x);
  });

  test("bounds clamp x and zero velocity into the wall", () => {
    const world: PhysicsWorld = { ...WORLD, bounds: { minX: -10, maxX: 10 } };
    const speeding: PhysicsState = {
      position: { x: 9.9, y: 0 },
      velocity: { x: 500, y: 0 },
    };
    const next = stepPhysics(speeding, IDLE, DT, world);
    expect(next.position.x).toBe(10);
    expect(next.velocity.x).toBe(0);
  });

  test("a downward impulse while grounded is absorbed by the clamp", () => {
    const shoved: PhysicsState = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 600 },
    };
    const next = stepPhysics(shoved, IDLE, DT, WORLD);
    expect(next.position.y).toBe(0);
    expect(next.velocity.y).toBe(0);
  });
});

describe("isResting", () => {
  test("true for a body sitting still on the ground", () => {
    expect(isResting(atRest())).toBe(true);
  });

  test("false while sliding", () => {
    expect(
      isResting({ position: { x: 0, y: 0 }, velocity: { x: 50, y: 0 } }),
    ).toBe(false);
  });

  test("false while airborne", () => {
    expect(
      isResting({ position: { x: 0, y: -30 }, velocity: { x: 0, y: 0 } }),
    ).toBe(false);
  });
});
