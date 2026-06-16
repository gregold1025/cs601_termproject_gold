// Dance-specific pure-helper tests: the force-to-impulse law, and the
// forward-rounding rotation snap. Command resolution + cross-library
// collision tests live in src/data/command.test.ts.

import {
  forceToImpulse,
  snapRotationForward,
  FORCE_STRENGTH_MULTIPLIER,
} from "./dance";

describe("forceToImpulse", () => {
  test("scales both components by the strength multiplier", () => {
    expect(forceToImpulse({ x: 10, y: -20 })).toEqual({
      x: 10 * FORCE_STRENGTH_MULTIPLIER,
      y: -20 * FORCE_STRENGTH_MULTIPLIER,
    });
  });
});

describe("snapRotationForward", () => {
  const STEP = 1;

  test("a clean full turn lands on the next multiple", () => {
    expect(snapRotationForward(0, 1, STEP)).toBe(1);
    expect(snapRotationForward(2, 1, STEP)).toBe(3);
  });

  test("no rotation requested from a stable orientation stays put", () => {
    expect(snapRotationForward(1, 0, STEP)).toBe(1);
    expect(snapRotationForward(0, 0, STEP)).toBe(0);
  });

  test("an interrupted flip completes forward instead of unwinding", () => {
    // Interrupted at 0.4 turns with no new rotation: nearest multiple is
    // 0 (which would rewind) — the rule pushes forward to 1 instead.
    expect(snapRotationForward(0.4, 0, STEP)).toBe(1);
    // Interrupted at 0.6: nearest is already forward.
    expect(snapRotationForward(0.6, 0, STEP)).toBe(1);
  });

  test("a forward move never lands behind its start", () => {
    // Start mid-flip at 0.4, add a full turn: ideal 1.4 → nearest 1,
    // which is still ahead of 0.4. Fine.
    expect(snapRotationForward(0.4, 1, STEP)).toBe(1);
    // Start at 0.9, add nothing: nearest of 0.9 is 1 — forward. Fine.
    expect(snapRotationForward(0.9, 0, STEP)).toBe(1);
  });

  test("backward moves mirror the rule", () => {
    expect(snapRotationForward(0, -1, STEP)).toBe(-1);
    expect(snapRotationForward(-0.4, -1, STEP)).toBe(-1);
  });
});
