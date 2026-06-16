// Playground — the windowed space the character lives in.
// Composes: <Biome /> (sky + parallax layers) + the character + overlay UI.
// Owns the window-width tracking and the camera math, because both the
// biome and the character need them to project the world into screen space.

import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Biome as BiomeName } from "../../data/avatar";
import { BIOME_SCENES } from "../../data/biomes";
import { Sticker } from "../../data/labs/shapes/stickers";
import { projectWorldToScreen } from "../../engine/projection";
import { Biome } from "./Biome";
import { StickerLayer } from "./StickerLayer";

// Vertical offset of the character's bottom from the playground's bottom.
// Tune this against each biome's ground-line position; same value for now.
// Exported so the StickerLayer projects onto the same ground line.
export const CHARACTER_GROUND_OFFSET = 60;

// The vertical camera holds the character at this fraction of the viewport
// height: he physically rises on screen until his feet reach the line, then
// the camera tracks 1:1 (raising the sky) while he keeps climbing. At 0.5 he
// locks at mid-screen. Because the line is viewport-relative, ordinary jumps
// (apex ~184px) never bob the camera on a normal-size window.
const CAMERA_FOLLOW_FRACTION = 0.5;

export type PlaygroundProps = {
  biome: BiomeName;
  character?: ReactNode;
  // Character position relative to world center (default { x: 0, y: 0 }).
  // characterX > 0 = right of world center. characterY < 0 = airborne.
  characterX?: number;
  characterY?: number;
  // Stickers placed in the world. Each carries its own world coordinate
  // and is projected through the same camera math as the character.
  stickers?: Sticker[];
  // Free overlay UI — siblings inside the playground, positioned by their
  // own styles (e.g. bottom-right CustomizeButton, top-center ColorPicker).
  children?: ReactNode;
};

export function Playground({
  biome,
  character,
  characterX = 0,
  characterY = 0,
  stickers = [],
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

  // The playground fills the viewport's leftover height (flex: 1), so its
  // pixel height is variable. Measure it — the sky gradient's top color stop
  // samples the world altitude at the viewport's top, so it needs the real
  // height to stay accurate at any window size. Everything else is anchored to
  // the bottom edge, so a shorter viewport simply clips sky from the top.
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 700,
  );
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setViewportHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Camera follows the character's world X, clamped within world bounds.
  // When clamped at an edge, the character slides off-center.
  const worldCenter = scene.width / 2;
  const characterWorldX = worldCenter + characterX;
  const minCamera = Math.min(windowWidth / 2, worldCenter);
  const maxCamera = Math.max(scene.width - windowWidth / 2, worldCenter);
  const cameraX = Math.min(Math.max(characterWorldX, minCamera), maxCamera);

  // Vertical camera: characterY < 0 is airborne, so altitude is how far
  // above the ground line the character has risen. His feet sit at screen
  // height CHARACTER_GROUND_OFFSET + altitude; once that reaches the follow
  // line (a fraction of the viewport), the camera tracks 1:1 so he locks
  // there while the world keeps scrolling down. The floor at 0 keeps the
  // world still at rest even if the line falls below the ground offset.
  const altitude = Math.max(0, -characterY);
  const followThreshold = Math.max(
    0,
    viewportHeight * CAMERA_FOLLOW_FRACTION - CHARACTER_GROUND_OFFSET,
  );
  const cameraY = Math.max(0, altitude - followThreshold);

  // Project the character's world coord into screen pixels — same helper
  // the StickerLayer uses, so any future camera-model change lands in
  // one place.
  const characterScreen = projectWorldToScreen(
    { worldX: characterX, worldY: characterY },
    {
      cameraX,
      cameraY,
      windowWidth,
      worldCenter,
      groundOffset: CHARACTER_GROUND_OFFSET,
    },
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        flex: "1 1 auto",
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Biome
        biome={biome}
        cameraX={cameraX}
        cameraY={cameraY}
        windowWidth={windowWidth}
        viewportHeight={viewportHeight}
      />

      <StickerLayer
        stickers={stickers}
        cameraX={cameraX}
        cameraY={cameraY}
        windowWidth={windowWidth}
        worldCenter={worldCenter}
      />

      {character && (
        <div
          style={{
            position: "absolute",
            left: characterScreen.left,
            bottom: characterScreen.bottom,
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
