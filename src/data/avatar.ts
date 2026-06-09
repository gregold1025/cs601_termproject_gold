// Core avatar types.
// Avatar is sealed at three visual choices: animal, adjective, biome.
// Palette data lives in palette.ts; biome data in biomes/.

export type Animal = "bear" | "pig" | "lion" | "monkey";

export type Adjective = "clever" | "friendly" | "brave" | "strong" | "loyal";

export type Biome = "mountains" | "desert" | "jungle";

export type Avatar = {
  animal: Animal;
  adjective: Adjective;
  biome: Biome;
};

// Welcome sentence template. Reads grammatically across all 60 combinations.
// e.g. "Welcome Brave Lion of the Mountain"
export function welcomeText(avatar: Avatar): string {
  const adj = capitalize(avatar.adjective);
  const animal = capitalize(avatar.animal);
  const biome = capitalize(avatar.biome);
  return `Welcome ${adj} ${animal} of the ${biome}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
