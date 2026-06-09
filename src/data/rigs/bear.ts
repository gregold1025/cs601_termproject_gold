// Bear rig. SVG viewBox 231 × 381.
// Naming convention: "left"/"right" = SCREEN orientation, not character anatomy.
// (i.e. leftShoulder is the shoulder appearing on the viewer's left side.)

import { CharacterRig, DEFAULT_MOUTH_CONFIG } from "../character";

export const BEAR_RIG: CharacterRig = {
  anchors: {
    leftShoulder: { x: 24, y: 239 },
    rightShoulder: { x: 208, y: 239 },
    leftHip: { x: 70, y: 366 },
    rightHip: { x: 163, y: 366 },
    mouth: { x: 116, y: 161 }, // mouth.x snapped to viewBox center (231/2)
  },
  limbs: {
    leftArm: { length: 110, angleMin: 60, angleMax: 270, bendMax: 60 },
    rightArm: { length: 110, angleMin: -90, angleMax: 120, bendMax: 60 },
    leftLeg: { length: 100, angleMin: 70, angleMax: 150, bendMax: 50 },
    rightLeg: { length: 100, angleMin: 30, angleMax: 110, bendMax: 50 },
  },
  mouth: DEFAULT_MOUTH_CONFIG,
};
