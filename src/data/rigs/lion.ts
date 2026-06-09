// Lion rig. SVG viewBox 316 × 410.

import { CharacterRig, DEFAULT_MOUTH_CONFIG } from "../character";

export const LION_RIG: CharacterRig = {
  anchors: {
    leftShoulder: { x: 77, y: 305 },
    rightShoulder: { x: 239, y: 305 },
    leftHip: { x: 125, y: 398 },
    rightHip: { x: 196, y: 398 },
    mouth: { x: 158, y: 208 }, // mouth.x snapped to viewBox center (316/2)
  },
  limbs: {
    leftArm: { length: 100, angleMin: 60, angleMax: 270, bendMax: 50 },
    rightArm: { length: 100, angleMin: -90, angleMax: 120, bendMax: 50 },
    leftLeg: { length: 100, angleMin: 70, angleMax: 150, bendMax: 45 },
    rightLeg: { length: 100, angleMin: 30, angleMax: 110, bendMax: 45 },
  },
  mouth: DEFAULT_MOUTH_CONFIG,
};
