// Pig rig. SVG viewBox 348 × 318.

import { CharacterRig, DEFAULT_MOUTH_CONFIG } from "./types";

export const PIG_RIG: CharacterRig = {
  anchors: {
    leftShoulder: { x: 97, y: 240 },
    rightShoulder: { x: 251, y: 240 },
    leftHip: { x: 142, y: 310 },
    rightHip: { x: 205, y: 310 },
    mouth: { x: 174, y: 160 }, // mouth.x snapped to viewBox center (348/2)
  },
  limbs: {
    leftArm: { length: 90, angleMin: 60, angleMax: 270, bendMax: 45 },
    rightArm: { length: 90, angleMin: -90, angleMax: 120, bendMax: 45 },
    leftLeg: { length: 90, angleMin: 70, angleMax: 150, bendMax: 40 },
    rightLeg: { length: 90, angleMin: 30, angleMax: 110, bendMax: 40 },
  },
  mouth: DEFAULT_MOUTH_CONFIG,
};
