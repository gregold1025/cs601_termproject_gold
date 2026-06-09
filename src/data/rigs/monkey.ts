// Monkey rig. SVG viewBox 231 × 375.

import { CharacterRig, DEFAULT_MOUTH_CONFIG } from "../character";

export const MONKEY_RIG: CharacterRig = {
  anchors: {
    leftShoulder: { x: 43, y: 233 },
    rightShoulder: { x: 187, y: 233 },
    leftHip: { x: 76, y: 356 },
    rightHip: { x: 156, y: 356 },
    mouth: { x: 116, y: 156 }, // mouth.x snapped to viewBox center (231/2)
  },
  limbs: {
    leftArm: { length: 120, angleMin: 60, angleMax: 270, bendMax: 65 },
    rightArm: { length: 120, angleMin: -90, angleMax: 120, bendMax: 65 },
    leftLeg: { length: 90, angleMin: 70, angleMax: 150, bendMax: 55 },
    rightLeg: { length: 90, angleMin: 30, angleMax: 110, bendMax: 55 },
  },
  mouth: DEFAULT_MOUTH_CONFIG,
};
