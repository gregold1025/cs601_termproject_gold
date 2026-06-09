// Biome registry. Three biomes for the MVP: mountain, desert, jungle.

import { Biome } from "../avatar";
import { BiomeScene } from "./types";
import { MOUNTAIN_BIOME } from "./mountain";
import { DESERT_BIOME } from "./desert";
import { JUNGLE_BIOME } from "./jungle";

export const BIOME_SCENES: Record<Biome, BiomeScene> = {
  mountains: MOUNTAIN_BIOME,
  desert: DESERT_BIOME,
  jungle: JUNGLE_BIOME,
};
