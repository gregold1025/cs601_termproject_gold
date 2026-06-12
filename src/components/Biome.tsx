// Biome — renders one biome scene (sky + three parallax SVG layers).
// Self-contained: fills its positioned parent with `inset: 0`. The parent
// (Playground) provides the camera position and window width so the
// layer offsets line up with the character's view of the world.
//
// Vertical: as the camera rises (cameraY), the whole ground plane recedes
// downward uniformly and the sky lerps from the biome's own color toward
// space-black — atmosphere giving way to space. Horizontal parallax is the
// side-to-side depth illusion; vertical recession is uniform (the ground
// is one plane). At rest (cameraY = 0) the biome's sky is preserved exactly.

import React from "react";
import type { Biome as BiomeName } from "../data/avatar";
import { BIOME_SCENES } from "../data/biomes";

export type BiomeProps = {
  biome: BiomeName;
  cameraX: number;
  cameraY: number;
  windowWidth: number;
  viewportHeight: number;
};

// The color of deep space, and how the sky reaches it.
const SPACE_COLOR = { r: 6, g: 8, b: 20 };
// World height (px above the ground line) over which sky → space completes.
const ATMOSPHERE_SPAN = 2500;
// Keep the first viewport-height of climb pristine, so the biome sky shows
// untouched at rest and space only creeps in once you're genuinely high.
const SKY_GRACE = 700;

export function Biome({
  biome,
  cameraX,
  cameraY,
  windowWidth,
  viewportHeight,
}: BiomeProps) {
  const scene = BIOME_SCENES[biome];
  const worldCenter = scene.width / 2;

  // For a layer with the given parallax rate, compute its CSS `left` so
  // that at cameraX = worldCenter the layer's center aligns with the
  // viewport center, and as cameraX shifts the layer slides at its rate.
  const layerLeft = (parallaxRate: number) =>
    windowWidth / 2 - worldCenter - (cameraX - worldCenter) * parallaxRate;

  const layers = [scene.back, scene.front, scene.foreground];

  // Sky gradient: the color at any world altitude, from the biome's sky up
  // to space. The viewport's bottom sits at world altitude `cameraY`; its
  // top at `cameraY + viewportHeight`. A two-stop linear gradient between
  // those exactly matches the underlying linear atmosphere.
  const skyBottom = skyAt(scene.sky, cameraY);
  const skyTop = skyAt(scene.sky, cameraY + viewportHeight);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(to top, ${skyBottom}, ${skyTop})`,
      }}
    >
      {layers.map((layer) => (
        <img
          key={layer.name}
          src={layer.svgUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: "absolute",
            left: layerLeft(layer.parallaxRate),
            // Whole ground plane drops uniformly as the camera rises.
            bottom: -cameraY,
            width: scene.width,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      ))}
    </div>
  );
}

// --- Sky helpers --------------------------------------------------------

function skyAt(skyHex: string, altitude: number): string {
  const base = hexToRgb(skyHex);
  if (!base) return skyHex; // non-hex sky: skip the gradient gracefully
  const t = clamp((altitude - SKY_GRACE) / ATMOSPHERE_SPAN, 0, 1);
  const r = Math.round(lerp(base.r, SPACE_COLOR.r, t));
  const g = Math.round(lerp(base.g, SPACE_COLOR.g, t));
  const b = Math.round(lerp(base.b, SPACE_COLOR.b, t));
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
