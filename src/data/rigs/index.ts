// Per-animal rig registry. Pure data — keeps SVG component imports out
// so it can be consumed by code that doesn't care about rendering.

import { Animal } from "../avatar";
import { CharacterRig } from "../character";
import { BEAR_RIG } from "./bear";
import { PIG_RIG } from "./pig";
import { LION_RIG } from "./lion";
import { MONKEY_RIG } from "./monkey";

export const RIGS: Record<Animal, CharacterRig> = {
  bear: BEAR_RIG,
  pig: PIG_RIG,
  lion: LION_RIG,
  monkey: MONKEY_RIG,
};
