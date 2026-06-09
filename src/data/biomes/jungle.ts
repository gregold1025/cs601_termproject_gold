import { BiomeScene } from "./types";
import bgBack from "../../assets/biomes/jungle-bg-back.svg";
import bgFront from "../../assets/biomes/jungle-bg-front.svg";
import foreground from "../../assets/biomes/jungle-foreground.svg";

export const JUNGLE_BIOME: BiomeScene = {
  name: "jungle",
  sky: "#97E6E7",
  width: 3500,
  height: 700,
  back:       { name: "jungle-bg-back",    svgUrl: bgBack,     parallaxRate: 0.2 },
  front:      { name: "jungle-bg-front",   svgUrl: bgFront,    parallaxRate: 0.55 },
  foreground: { name: "jungle-foreground", svgUrl: foreground, parallaxRate: 1.0 },
};
