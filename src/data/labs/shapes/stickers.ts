// Sticker artifact — a placed shape in the playground world.
//
// A Sticker is a Shape snapshotted at world coordinates. Composition is
// explicit: `sticker.shape` is a frozen copy of the source Shape (taken
// at spawn time), so later edits to the underlying Shape leave already-
// placed stickers untouched. Peel-and-stick semantics: once it's down,
// it's its own thing.
//
// The sticker carries its OWN id (separate from `shape.id`) so the same
// Shape can be placed multiple times — each placement is a distinct
// Sticker, and the React key / localStorage row / deletion target all
// live at the Sticker level.
//
// World coordinates use the same convention as the character: x is
// horizontal (positive = right of world center), y is vertical with
// NEGATIVE values for "up" (matching characterY < 0 = airborne).

import { Shape } from "./grammar";
import { newId } from "../../ids";

export type Sticker = {
  id: string;
  shape: Shape; // frozen Shape snapshot taken at spawn time
  worldX: number;
  worldY: number;
};

export function newStickerId(): string {
  return newId("sticker");
}

// Shared localStorage key for placed stickers. Bump the version suffix
// on breaking Sticker shape changes — v1 was a flat snapshot
// (source + colorSeed); v2 composes a full Shape. Old v1 rows simply
// fall through to the default empty array on the next read.
export const STICKER_LIBRARY_KEY = "ugp.sticker-library.v2";

// Spawn offset from the character at the moment of placement. Fixed in
// world space — "always at the same position relative to the character"
// at spawn time. After spawn, the sticker stays put; the character can
// walk away.
export const STICKER_SPAWN_OFFSET_X = 100; // px right of character
export const STICKER_SPAWN_OFFSET_Y = -150; // px above character (negative = up)

// Square display box for ShapeRenderer. The renderer's auto-fit viewBox
// letterboxes non-square shapes inside this box, so visual weight stays
// roughly consistent regardless of which shape gets spawned.
export const STICKER_RENDER_SIZE = 150;
