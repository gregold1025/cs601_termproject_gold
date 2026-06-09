// Biome scene types.
// Each biome is a sky color plus three SVG asset layers
// (back, front, foreground) at different parallax rates.

import { Biome } from "../avatar";

export type BiomeLayer = {
  name: string;
  svgUrl: string;        // resolved URL of the imported SVG asset
  parallaxRate: number;  // 0 = static, 1 = locked to camera
};

export type BiomeScene = {
  name: Biome;
  sky: string;           // hex color
  width: number;         // natural canvas width
  height: number;        // natural canvas height
  back: BiomeLayer;
  front: BiomeLayer;
  foreground: BiomeLayer;
};
