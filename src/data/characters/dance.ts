// Move artifact type for the dance lab.
//
// One Move per saved command. Carries optional pose, force vector, and
// axis rotations. Speed is uniform across the whole move. A move with
// only a pose simply doesn't translate; one with only a force vector
// simply doesn't change pose. Both can coexist on the same command.

import { CharacterPose } from "./types";

export type Move = {
  id: string;
  primary: string;
  secondary?: string;
  speed: number;
  targetPose?: CharacterPose;
  forceVector?: { x: number; y: number };
  rotationY?: number; // whole turns (1 = 360°)
  rotationZ?: number;
};

export function newMoveId(): string {
  return `move-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Shared localStorage key for the move library. The dance lab writes;
// the playground reads. Bump the version suffix on breaking shape changes.
export const MOVE_LIBRARY_KEY = "ugp.move-library.v1";

// Resolve a typed command against the library. Matches primary or
// secondary, case-insensitive. Returns null when nothing matches.
// This is the seam where higher-order parsing (slow / R3 / etc.) will
// eventually live — the signature stays string → Move | null.
export function resolveCommand(query: string, library: Move[]): Move | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    library.find(
      (m) =>
        m.primary.toLowerCase() === q ||
        (m.secondary !== undefined && m.secondary.toLowerCase() === q),
    ) ?? null
  );
}

// Resolve a dot-chained command string ("mw.wm") into an ordered list
// of moves to execute sequentially. Every segment must resolve or the
// whole chain is invalid — no partial execution. Empty segments from
// stray dots ("mw." / "mw..wm") are forgiven.
// A single bare command is just a one-link chain.
export function resolveCommandChain(
  query: string,
  library: Move[],
): Move[] | null {
  const parts = query
    .split(".")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return null;
  const moves: Move[] = [];
  for (const part of parts) {
    const move = resolveCommand(part, library);
    if (!move) return null;
    moves.push(move);
  }
  return moves;
}

// True when `name` is already used — as either a primary or a secondary
// command — by any move other than `excludeId`. Command names form one
// flat namespace, since resolveCommand searches both fields.
// Pass excludeId when updating an existing move (keeping its own name is
// not a collision); pass null when saving a brand-new move.
export function isCommandTaken(
  name: string,
  library: Move[],
  excludeId: string | null,
): boolean {
  const q = name.trim().toLowerCase();
  if (!q) return false;
  return library.some(
    (m) =>
      m.id !== excludeId &&
      (m.primary.toLowerCase() === q ||
        (m.secondary !== undefined && m.secondary.toLowerCase() === q)),
  );
}

// The force vector handle is bounded by the inscribed circle of the
// character viewBox, so the multiplier compensates for the smaller
// circular reach (max effective velocity ≈ inscribed radius × multiplier).
export const FORCE_STRENGTH_MULTIPLIER = 3.5;

// THE one place a saved force vector becomes a physics impulse (px/s).
// Both the dance lab and the playground launch through this function,
// so the conversion law lives at a single altitude.
export function forceToImpulse(vec: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: vec.x * FORCE_STRENGTH_MULTIPLIER,
    y: vec.y * FORCE_STRENGTH_MULTIPLIER,
  };
}

// The sequence metronome: a move occupies MOVE_TEMPO / speed seconds
// before the next chain link fires. Fixed and deterministic — the
// VISUAL animation may stretch longer (a launch's flip rides its arc),
// but the next move always starts on the beat.
export const MOVE_TEMPO = 0.6;

// Speed slider bounds.
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2.0;
export const SPEED_DEFAULT = 1.0;

// Rotation snap increments. The form uses these as input step values;
// the articulation engine snaps each animation's END rotation to a
// multiple of these so interruptions can't leave the character in an
// unstable orientation.
export const ROTATION_Y_STEP = 1;
export const ROTATION_Z_STEP = 1;

// Snap a rotation's end value to a step multiple, never rotating
// BACKWARD against the move's direction. Round-to-nearest, with one
// correction: if nearest would unwind (end up behind the start for a
// forward move, or ahead of it for a backward move), push one step
// further instead. An interrupted flip therefore always completes its
// rotation rather than rewinding. For delta = 0, forward (+) is the
// completion direction.
export function snapRotationForward(
  start: number,
  delta: number,
  step: number,
): number {
  const ideal = start + delta;
  let snapped = Math.round(ideal / step) * step;
  if (delta >= 0 && snapped < start) snapped += step;
  else if (delta < 0 && snapped > start) snapped -= step;
  return snapped;
}
