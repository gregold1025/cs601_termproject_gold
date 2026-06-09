// Biome arrows — at the playground's left/right edges.
// Click cycles through the 3 biomes.

import React from "react";
import { Biome } from "../../data/avatar";
import "./customize-ui.css";

const BIOMES: Biome[] = ["mountains", "desert", "jungle"];

function step(current: Biome, direction: -1 | 1): Biome {
  const idx = BIOMES.indexOf(current);
  return BIOMES[(idx + direction + BIOMES.length) % BIOMES.length];
}

export type BiomeArrowsProps = {
  selected: Biome;
  onSelect: (biome: Biome) => void;
};

export function BiomeArrows({ selected, onSelect }: BiomeArrowsProps) {
  return (
    <>
      <button
        type="button"
        aria-label="previous biome"
        onClick={() => onSelect(step(selected, -1))}
        className="cui-biome-arrow cui-biome-arrow--left"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <polygon points="18,3 4,11 18,19" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="next biome"
        onClick={() => onSelect(step(selected, 1))}
        className="cui-biome-arrow cui-biome-arrow--right"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <polygon points="4,3 18,11 4,19" fill="currentColor" />
        </svg>
      </button>
    </>
  );
}
