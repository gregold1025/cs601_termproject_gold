import { BiomeScene } from "./types";
import bgBack from "../../assets/biomes/mountain-bg-back.svg";
import bgFront from "../../assets/biomes/mountain-bg-front.svg";
import foreground from "../../assets/biomes/mountain-foreground.svg";

export const MOUNTAIN_BIOME: BiomeScene = {
  name: "mountains",
  sky: "#C1CBFF",
  width: 3500,
  height: 700,
  back: { name: "mountain-bg-back", svgUrl: bgBack, parallaxRate: 0.2 },
  front: { name: "mountain-bg-front", svgUrl: bgFront, parallaxRate: 0.55 },
  foreground: {
    name: "mountain-foreground",
    svgUrl: foreground,
    parallaxRate: 1.0,
  },
};
