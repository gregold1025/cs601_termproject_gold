// Tests for the cross-lab command surface: resolution, dot-chaining,
// and cross-library name-collision checking. Dance-specific pure tests
// (force law, rotation snap) live in labs/dance-moves/dance.test.ts.

import { resolveCommand, resolveCommandChain, isCommandTaken } from "./command";
import { Move } from "./labs/dance-moves/dance";
import { Shape } from "./labs/shapes/grammar";

const move = (id: string, primary: string, secondary?: string): Move => ({
  id,
  primary,
  secondary,
  speed: 1,
});

const shape = (id: string, name: string): Shape => ({
  id,
  name,
  source: "tssb",
  colorSeed: 0,
});

const MOVES: Move[] = [
  move("1", "wave", "w"),
  move("2", "moonwalk", "mw"),
  move("3", "Flip"),
];

const SHAPES: Shape[] = [
  shape("s1", "triangle"),
  shape("s2", "Square"),
];

describe("resolveCommand", () => {
  test("matches a move's primary, case-insensitive", () => {
    expect(resolveCommand("WAVE", MOVES, SHAPES)).toEqual({
      type: "move",
      move: MOVES[0],
    });
    expect(resolveCommand("flip", MOVES, SHAPES)).toEqual({
      type: "move",
      move: MOVES[2],
    });
  });

  test("matches a move's secondary alias", () => {
    expect(resolveCommand("mw", MOVES, SHAPES)).toEqual({
      type: "move",
      move: MOVES[1],
    });
  });

  test("matches a shape name as a shape token", () => {
    expect(resolveCommand("triangle", MOVES, SHAPES)).toEqual({
      type: "shape",
      shape: SHAPES[0],
    });
  });

  test("shape matching is case-insensitive", () => {
    expect(resolveCommand("SQUARE", MOVES, SHAPES)).toEqual({
      type: "shape",
      shape: SHAPES[1],
    });
  });

  test("returns null for unknown or empty input", () => {
    expect(resolveCommand("nope", MOVES, SHAPES)).toBeNull();
    expect(resolveCommand("   ", MOVES, SHAPES)).toBeNull();
  });

  test("moves win on collision (tie-break order)", () => {
    const colliding: Shape[] = [shape("s9", "wave")];
    expect(resolveCommand("wave", MOVES, colliding)).toEqual({
      type: "move",
      move: MOVES[0],
    });
  });
});

describe("resolveCommandChain", () => {
  test("a bare move command is a one-link chain", () => {
    expect(resolveCommandChain("wave", MOVES, SHAPES)).toEqual([
      { type: "move", move: MOVES[0] },
    ]);
  });

  test("a bare shape name is a one-link shape chain", () => {
    expect(resolveCommandChain("triangle", MOVES, SHAPES)).toEqual([
      { type: "shape", shape: SHAPES[0] },
    ]);
  });

  test("dot-chains resolve in order", () => {
    expect(resolveCommandChain("mw.wave", MOVES, SHAPES)).toEqual([
      { type: "move", move: MOVES[1] },
      { type: "move", move: MOVES[0] },
    ]);
  });

  test("mixed chains interleave shapes and moves", () => {
    expect(resolveCommandChain("triangle.mw", MOVES, SHAPES)).toEqual([
      { type: "shape", shape: SHAPES[0] },
      { type: "move", move: MOVES[1] },
    ]);
  });

  test("all-or-nothing: one unknown segment invalidates the chain", () => {
    expect(resolveCommandChain("mw.nope", MOVES, SHAPES)).toBeNull();
    expect(resolveCommandChain("triangle.nope", MOVES, SHAPES)).toBeNull();
  });

  test("stray dots are forgiven", () => {
    expect(resolveCommandChain("mw.", MOVES, SHAPES)).toEqual([
      { type: "move", move: MOVES[1] },
    ]);
    expect(resolveCommandChain("triangle..mw", MOVES, SHAPES)).toEqual([
      { type: "shape", shape: SHAPES[0] },
      { type: "move", move: MOVES[1] },
    ]);
  });

  test("empty input is invalid", () => {
    expect(resolveCommandChain(".", MOVES, SHAPES)).toBeNull();
    expect(resolveCommandChain("", MOVES, SHAPES)).toBeNull();
  });
});

describe("isCommandTaken", () => {
  test("collides against another move's primary", () => {
    expect(isCommandTaken("wave", MOVES, SHAPES, null, null)).toBe(true);
  });

  test("collides against another move's secondary (flat namespace)", () => {
    expect(isCommandTaken("mw", MOVES, SHAPES, null, null)).toBe(true);
  });

  test("collides against a shape's name (cross-library)", () => {
    expect(isCommandTaken("triangle", MOVES, SHAPES, null, null)).toBe(true);
    expect(isCommandTaken("SQUARE", MOVES, SHAPES, null, null)).toBe(true);
  });

  test("case-insensitive on moves and shapes alike", () => {
    expect(isCommandTaken("FLIP", MOVES, SHAPES, null, null)).toBe(true);
    expect(isCommandTaken("triangle", MOVES, SHAPES, null, null)).toBe(true);
  });

  test("an artifact keeping its own name is not a collision", () => {
    expect(isCommandTaken("wave", MOVES, SHAPES, "1", null)).toBe(false);
    expect(isCommandTaken("triangle", MOVES, SHAPES, null, "s1")).toBe(false);
  });

  test("free names and empty strings are not taken", () => {
    expect(isCommandTaken("spin", MOVES, SHAPES, null, null)).toBe(false);
    expect(isCommandTaken("  ", MOVES, SHAPES, null, null)).toBe(false);
  });
});
