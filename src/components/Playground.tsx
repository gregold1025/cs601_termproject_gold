// Playground — the windowed biome environment the character lives in.
// Renders a full-window-width, 700px-tall frame with the biome's three
// SVG layers parallax-stacked behind. The character has its own slot;
// other overlay UI (buttons, controls) lives as free children.

import React, { ReactNode, useEffect, useState } from "react";
import { Biome } from "../data/avatar";
import { BIOME_SCENES } from "../data/biomes";

const PLAYGROUND_HEIGHT = 700;

// Vertical offset of the character's bottom from the playground's bottom.
// Tune this against each biome's ground-line position; same value for now.
const CHARACTER_GROUND_OFFSET = 60;

export type PlaygroundProps = {
  biome: Biome;
  // The character renders in the canonical center-ground slot.
  character?: ReactNode;
  // Free overlay UI — siblings inside the playground, each positioned
  // by its own styles (e.g. bottom-right CustomizeButton, top ColorPicker).
  children?: ReactNode;
};

export function Playground({ biome, character, children }: PlaygroundProps) {
  const scene = BIOME_SCENES[biome];

  // Track the window width so layer offsets recompute on resize.
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : scene.width,
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Static initial camera at world center.
  // When the avatar can move, cameraX becomes dynamic state.
  const cameraX = scene.width / 2;

  // For a layer with the given parallax rate, compute its CSS `left` in
  // pixels so that at cameraX = scene.width / 2 (center of world) the
  // layer's center aligns with the viewport center, and as cameraX
  // shifts the layer slides at its own rate.
  const layerLeft = (parallaxRate: number) =>
    windowWidth / 2 -
    scene.width / 2 -
    (cameraX - scene.width / 2) * parallaxRate;

  const layers = [scene.back, scene.front, scene.foreground];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: PLAYGROUND_HEIGHT,
        background: scene.sky,
        overflow: "hidden",
      }}
    >
      {/* Biome layers — back to front, anchored to bottom. */}
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

      {/* Character — canonical center-ground slot. */}
      {character && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: CHARACTER_GROUND_OFFSET,
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          {character}
        </div>
      )}

      {/* Overlay children — free siblings, position themselves. */}
      {children}
    </div>
  );
}
