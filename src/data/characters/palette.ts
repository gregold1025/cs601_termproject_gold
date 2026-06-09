// Color and palette data — adjective ↔ color ↔ palette mappings.
// Bi-directional lookups so you can start from either an adjective or
// a color name and end up with the same palette.

import { Adjective } from "../avatar";

// Color name aliases for the five adjectives.
export type ColorName = "blue" | "orange" | "red" | "green" | "purple";

// A palette is two color stops: the darker, more-saturated tone
// (paired with the SVG's #CCCCCC fills) and the lighter, less-saturated
// tone (paired with the SVG's #EEEEEE fills). Black stays black.
export type Palette = {
  light: string;
  dark: string;
};

// Canonical mapping: adjective → palette.
// Hex values are placeholder defaults; refine against the brand later.
export const ADJECTIVE_PALETTES: Record<Adjective, Palette> = {
  clever: { light: "#8FB8FF", dark: "#1B3E8C" }, // blue
  friendly: { light: "#FFB870", dark: "#B0530B" }, // orange
  brave: { light: "#FF8A8A", dark: "#8C1B1B" }, // red
  strong: { light: "#9AD7A0", dark: "#1F6A2A" }, // green
  loyal: { light: "#C9A5E8", dark: "#5A2F8C" }, // purple
};

// Adjective ↔ color name mappings (both directions).
export const ADJECTIVE_TO_COLOR: Record<Adjective, ColorName> = {
  clever: "blue",
  friendly: "orange",
  brave: "red",
  strong: "green",
  loyal: "purple",
};

export const COLOR_TO_ADJECTIVE: Record<ColorName, Adjective> = {
  blue: "clever",
  orange: "friendly",
  red: "brave",
  green: "strong",
  purple: "loyal",
};

// Same palettes, keyed by color name instead of adjective.
// Derived from ADJECTIVE_PALETTES via the color → adjective map.
export const COLOR_PALETTES: Record<ColorName, Palette> = {
  blue: ADJECTIVE_PALETTES.clever,
  orange: ADJECTIVE_PALETTES.friendly,
  red: ADJECTIVE_PALETTES.brave,
  green: ADJECTIVE_PALETTES.strong,
  purple: ADJECTIVE_PALETTES.loyal,
};

// --- SVG fill ↔ CSS variable plumbing ------------------------------------

// The placeholder fill hex codes that animals use in their exported SVGs.
// After find/replace, these become CSS var() references that resolve at
// render time based on the chosen adjective's palette.
export const SVG_SHADE_HEX = {
  light: "#EEEEEE", // light gray placeholder → resolves to palette.light
  dark: "#CCCCCC", // dark gray placeholder  → resolves to palette.dark
} as const;

// The CSS variable names used inside the post-swap SVGs.
// The Character component sets these on a wrapper element based on the
// avatar's chosen adjective.
export const SVG_SHADE_VAR = {
  light: "--shade-light",
  dark: "--shade-dark",
} as const;
