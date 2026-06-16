// StickerLayer — renders all placed stickers projected through the
// playground's camera. Routes each sticker through the shared
// projectWorldToScreen helper so the character and stickers stay in
// sync if the camera model ever changes (zoom, parallax-anchored
// items, etc.).

import React from "react";
import { Sticker, STICKER_RENDER_SIZE } from "../../data/labs/shapes/stickers";
import { ShapeRenderer } from "../labs/shape-lab/ShapeRenderer";
import { projectWorldToScreen } from "../../engine/projection";
import { CHARACTER_GROUND_OFFSET } from "./Playground";
import "./StickerLayer.css";

export type StickerLayerProps = {
  stickers: Sticker[];
  cameraX: number;
  cameraY: number;
  windowWidth: number;
  worldCenter: number;
};

export function StickerLayer({
  stickers,
  cameraX,
  cameraY,
  windowWidth,
  worldCenter,
}: StickerLayerProps) {
  return (
    <>
      {stickers.map((sticker) => {
        // Defensive guard: a sticker persisted under an earlier schema
        // (or written during a partial HMR cycle) may be missing its
        // .shape composition. Skip it instead of crashing the whole
        // layer; clearing localStorage removes the orphans for good.
        if (!sticker.shape) return null;

        const { left, bottom } = projectWorldToScreen(
          { worldX: sticker.worldX, worldY: sticker.worldY },
          {
            cameraX,
            cameraY,
            windowWidth,
            worldCenter,
            groundOffset: CHARACTER_GROUND_OFFSET,
          },
        );
        return (
          <div key={sticker.id} className="sticker" style={{ left, bottom }}>
            <ShapeRenderer
              source={sticker.shape.source}
              colorSeed={sticker.shape.colorSeed}
              size={STICKER_RENDER_SIZE}
            />
          </div>
        );
      })}
    </>
  );
}
