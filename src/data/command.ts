// Cross-lab command resolution — the typed-command surface every lab
// shares. Sits one level above the per-lab artifact files (dance moves,
// shapes) because it knows about both.
//
// A typed string in CommandInput becomes a chain of CommandTokens; the
// sequencer dispatches each token to the right engine (move → physics +
// articulation; spawn → sticker callback). Cross-library name collisions
// are blocked at save time by isCommandTaken so that resolution is
// unambiguous at run time.

import { Move } from "./labs/dance-moves/dance";
import { Shape } from "./labs/shapes/grammar";

// What a single typed command segment resolves to. Moves play through
// the sequencer (force + articulation + airtime prediction); shapes
// spawn as decorative stickers in the world. The runner and sequencer
// dispatch on `type` — coordination knowledge stays in the conductor.
export type CommandToken =
  | { type: "move"; move: Move }
  | { type: "shape"; shape: Shape };

// Resolve a typed command against both libraries. Matches a move's
// primary or secondary (case-insensitive) first; falls through to a
// shape's name. Returns null when nothing matches.
// Cross-library name collisions are blocked at save time by
// isCommandTaken, so first-match-wins ordering is a tie-break that
// never actually fires in well-formed state.
export function resolveCommand(
  query: string,
  moves: Move[],
  shapes: Shape[],
): CommandToken | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const move = moves.find(
    (m) =>
      m.primary.toLowerCase() === q ||
      (m.secondary !== undefined && m.secondary.toLowerCase() === q),
  );
  if (move) return { type: "move", move };
  const shape = shapes.find((s) => s.name.toLowerCase() === q);
  if (shape) return { type: "shape", shape };
  return null;
}

// Resolve a dot-chained command string ("mw.wm" / "triangle.mw") into an
// ordered list of tokens to execute sequentially. Every segment must
// resolve or the whole chain is invalid — no partial execution. Empty
// segments from stray dots ("mw." / "mw..wm") are forgiven.
// A single bare command is just a one-link chain.
export function resolveCommandChain(
  query: string,
  moves: Move[],
  shapes: Shape[],
): CommandToken[] | null {
  const parts = query
    .split(".")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return null;
  const tokens: CommandToken[] = [];
  for (const part of parts) {
    const token = resolveCommand(part, moves, shapes);
    if (!token) return null;
    tokens.push(token);
  }
  return tokens;
}

// True when `name` is already used — as either a move's primary, a
// move's secondary, or a shape's name — by any artifact other than
// the one being edited. Command names form one flat namespace across
// both libraries.
//
// `excludeMoveId` skips a move being updated; `excludeShapeId` skips a
// shape being updated. Both are independent so a stray cross-library
// id overlap (e.g. hand-typed fixture ids) can't silently exempt the
// wrong artifact from the collision scan.
export function isCommandTaken(
  name: string,
  moves: Move[],
  shapes: Shape[],
  excludeMoveId: string | null,
  excludeShapeId: string | null,
): boolean {
  const q = name.trim().toLowerCase();
  if (!q) return false;
  if (
    moves.some(
      (m) =>
        m.id !== excludeMoveId &&
        (m.primary.toLowerCase() === q ||
          (m.secondary !== undefined && m.secondary.toLowerCase() === q)),
    )
  ) {
    return true;
  }
  return shapes.some(
    (s) => s.id !== excludeShapeId && s.name.toLowerCase() === q,
  );
}
