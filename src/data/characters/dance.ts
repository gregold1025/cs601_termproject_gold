// Move artifact type for the dance editor.
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

// Applied at play time. The force vector handle is bounded by the
// inscribed circle of the character viewBox, so the multiplier
// compensates for the smaller circular reach (max effective velocity
// ≈ inscribed radius × multiplier).
export const FORCE_STRENGTH_MULTIPLIER = 3;

// Speed slider bounds.
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2.0;
export const SPEED_DEFAULT = 1.0;

// Rotation snap increments. The form uses these as input step values;
// the player snaps each animation's END rotation to a multiple of these
// so interruptions can't leave the character in an unstable orientation.
//   Y = ½ turn → upright facing forward OR mirrored (both stable).
//   Z = 1 turn → upright facing forward (rotational identity).
export const ROTATION_Y_STEP = 1;
export const ROTATION_Z_STEP = 1;
