// Playground — the windowed space the character lives in.
// Composes: <Biome /> (sky + parallax layers) + the character + overlay UI.
// Owns the window-width tracking and the camera math, because both the
// biome and the character need them to project the world into screen space.

import React, { ReactNode, useEffect, useState } from "react";
import { Biome as BiomeName } from "../data/avatar";
import { BIOME_SCENES } from "../data/biomes";
import { Biome } from "./Biome";

const PLAYGROUND_HEIGHT = 700;

// Vertical offset of the character's bottom from the playground's bottom.
// Tune this against each biome's ground-line position; same value for now.
const CHARACTER_GROUND_OFFSET = 60;

export type PlaygroundProps = {
  biome: BiomeName;
  character?: ReactNode;
  // Character position relative to world center (default { x: 0, y: 0 }).
  // characterX > 0 = right of world center. characterY < 0 = airborne.
  characterX?: number;
  characterY?: number;
  // Free overlay UI — siblings inside the playground, positioned by their
  // own styles (e.g. bottom-right CustomizeButton, top-center ColorPicker).
  children?: ReactNode;
};

export function Playground({
  biome,
  character,
  characterX = 0,
  characterY = 0,
  children,
}: PlaygroundProps) {
  const scene = BIOME_SCENES[biome];

  // Track the window width so layer offsets and camera clamping update on resize.
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : scene.width,
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Camera follows the character's world X, clamped within world bounds.
  // When clamped at an edge, the character slides off-center.
  const worldCenter = scene.width / 2;
  const characterWorldX = worldCenter + characterX;
  const minCamera = Math.min(windowWidth / 2, worldCenter);
  const maxCamera = Math.max(scene.width - windowWidth / 2, worldCenter);
  const cameraX = Math.min(
    Math.max(characterWorldX, minCamera),
    maxCamera,
  );
  const characterScreenLeft = characterWorldX - cameraX + windowWidth / 2;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: PLAYGROUND_HEIGHT,
        overflow: "hidden",
      }}
    >
      <Biome biome={biome} cameraX={cameraX} windowWidth={windowWidth} />

      {character && (
        <div
          style={{
            position: "absolute",
            left: characterScreenLeft,
            bottom: CHARACTER_GROUND_OFFSET - characterY,
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          {character}
        </div>
      )}

      {children}
    </div>
  );
}
