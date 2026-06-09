// Biome — renders one biome scene (sky + three parallax SVG layers).
// Self-contained: fills its positioned parent with `inset: 0`. The parent
// (Playground) provides the camera position and window width so the
// layer offsets line up with the character's view of the world.

import React from "react";
import type { Biome as BiomeName } from "../data/avatar";
import { BIOME_SCENES } from "../data/biomes";

export type BiomeProps = {
  biome: BiomeName;
  cameraX: number;
  windowWidth: number;
};

export function Biome({ biome, cameraX, windowWidth }: BiomeProps) {
  const scene = BIOME_SCENES[biome];
  const worldCenter = scene.width / 2;

  // For a layer with the given parallax rate, compute its CSS `left` so
  // that at cameraX = worldCenter the layer's center aligns with the
  // viewport center, and as cameraX shifts the layer slides at its rate.
  const layerLeft = (parallaxRate: number) =>
    windowWidth / 2 - worldCenter - (cameraX - worldCenter) * parallaxRate;

  const layers = [scene.back, scene.front, scene.foreground];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: scene.sky,
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
            bottom: 0,
            width: scene.width,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      ))}
    </div>
  );
}
