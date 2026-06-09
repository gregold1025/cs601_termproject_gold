import { BiomeScene } from "./types";
import bgBack from "../../assets/biomes/desert-bg-back.svg";
import bgFront from "../../assets/biomes/desert-bg-front.svg";
import foreground from "../../assets/biomes/desert-foreground.svg";

export const DESERT_BIOME: BiomeScene = {
  name: "desert",
  sky: "#DEFCFF",
  width: 3500,
  height: 700,
  back:       { name: "desert-bg-back",    svgUrl: bgBack,     parallaxRate: 0.2 },
  front:      { name: "desert-bg-front",   svgUrl: bgFront,    parallaxRate: 0.55 },
  foreground: { name: "desert-foreground", svgUrl: foreground, parallaxRate: 1.0 },
};
