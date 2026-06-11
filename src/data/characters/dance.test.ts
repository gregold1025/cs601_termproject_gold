// Tests for the pure command/move helpers: resolution, chaining,
// name-collision checking, the force-to-impulse law, and the
// forward-rounding rotation snap.

import {
  Move,
  resolveCommand,
  resolveCommandChain,
  isCommandTaken,
  forceToImpulse,
  snapRotationForward,
  FORCE_STRENGTH_MULTIPLIER,
} from "./dance";

const move = (id: string, primary: string, secondary?: string): Move => ({
  id,
  primary,
  secondary,
  speed: 1,
});

const LIBRARY: Move[] = [
  move("1", "wave", "w"),
  move("2", "moonwalk", "mw"),
  move("3", "Flip"),
];

describe("resolveCommand", () => {
  test("matches primary, case-insensitive", () => {
    expect(resolveCommand("WAVE", LIBRARY)?.id).toBe("1");
    expect(resolveCommand("flip", LIBRARY)?.id).toBe("3");
  });

  test("matches secondary alias", () => {
    expect(resolveCommand("mw", LIBRARY)?.id).toBe("2");
  });

  test("returns null for unknown or empty input", () => {
    expect(resolveCommand("nope", LIBRARY)).toBeNull();
    expect(resolveCommand("   ", LIBRARY)).toBeNull();
  });
});

describe("resolveCommandChain", () => {
  test("a bare command is a one-link chain", () => {
    expect(resolveCommandChain("wave", LIBRARY)?.map((m) => m.id)).toEqual([
      "1",
    ]);
  });

  test("dot-chains resolve in order", () => {
    expect(resolveCommandChain("mw.wave", LIBRARY)?.map((m) => m.id)).toEqual([
      "2",
      "1",
    ]);
  });

  test("all-or-nothing: one unknown segment invalidates the chain", () => {
    expect(resolveCommandChain("mw.nope", LIBRARY)).toBeNull();
  });

  test("stray dots are forgiven", () => {
    expect(resolveCommandChain("mw.", LIBRARY)?.map((m) => m.id)).toEqual([
      "2",
    ]);
    expect(resolveCommandChain("mw..wave", LIBRARY)?.map((m) => m.id)).toEqual(
      ["2", "1"],
    );
  });

  test("empty input is invalid", () => {
    expect(resolveCommandChain(".", LIBRARY)).toBeNull();
    expect(resolveCommandChain("", LIBRARY)).toBeNull();
  });
});

describe("isCommandTaken", () => {
  test("collides against another move's primary", () => {
    expect(isCommandTaken("wave", LIBRARY, null)).toBe(true);
  });

  test("collides against another move's secondary (flat namespace)", () => {
    expect(isCommandTaken("mw", LIBRARY, null)).toBe(true);
  });

  test("case-insensitive", () => {
    expect(isCommandTaken("FLIP", LIBRARY, null)).toBe(true);
  });

  test("a move keeping its own name is not a collision", () => {
    expect(isCommandTaken("wave", LIBRARY, "1")).toBe(false);
  });

  test("free names and empty strings are not taken", () => {
    expect(isCommandTaken("spin", LIBRARY, null)).toBe(false);
    expect(isCommandTaken("  ", LIBRARY, null)).toBe(false);
  });
});

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
