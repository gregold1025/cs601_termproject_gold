// Character pose types, rig configuration, and limb/mouth math.
// Each animal has a static body+head SVG plus a rig defining where the
// limbs attach (anchors) and how they behave (length, angle bounds, bend).

export type Point = { x: number; y: number };

// --- Limbs ---------------------------------------------------------------

// LimbState — two scalars describe a limb's articulation.
//   endAngle:   degrees of rotation of the endpoint around its shoulder/hip.
//   bendAmount: perpendicular displacement of the Bezier control point.
//               0 = straight limb. Positive bows one way, negative the other.
export type LimbState = {
  endAngle: number;
  bendAmount: number;
};

// LimbConfig — per-limb constants.
export type LimbConfig = {
  length: number;        // straight-line distance from anchor to endpoint
  angleMin: number;      // degrees, clamp on endAngle
  angleMax: number;      // degrees, clamp on endAngle
  bendMax: number;       // absolute max for |bendAmount|
};

// --- Mouth ---------------------------------------------------------------

// MouthState — parametric arc of an ellipse.
//   width/height: ellipse axes (clamped per MouthConfig).
//   startAngle:   degrees, where the arc begins on the ellipse.
//                 0° = right side (+x), 90° = bottom (+y), etc. (SVG y-down)
//   sweepAngle:   degrees, signed. Positive = clockwise in SVG space.
// Default smile: startAngle=0, sweepAngle=180 draws a U-curve along the
// bottom half of an ellipse with a horizontal flat-top across the diameter.
export type MouthState = {
  width: number;
  height: number;
  startAngle: number;
  sweepAngle: number;
};

// MouthConfig — clamp bounds for the mouth.
// startAngle and sweepAngle are unclamped (no ratio model — they just
// rotate / sweep freely).
export type MouthConfig = {
  widthMin: number;
  widthMax: number;
  heightMin: number;
  heightMax: number;
};

export const DEFAULT_MOUTH_CONFIG: MouthConfig = {
  widthMin: 20,
  widthMax: 50,
  heightMin: 1,
  heightMax: 25,
};

// --- Pose & rig ----------------------------------------------------------

// CharacterPose — instantaneous state of all articulable elements.
export type CharacterPose = {
  leftArm: LimbState;
  rightArm: LimbState;
  leftLeg: LimbState;
  rightLeg: LimbState;
  mouth: MouthState;
};

// BodyAnchors — fixed attachment points on the body SVG, in viewBox space.
export type BodyAnchors = {
  leftShoulder: Point;
  rightShoulder: Point;
  leftHip: Point;
  rightHip: Point;
  mouth: Point;          // center of the mouth ellipse
};

// CharacterRig — full per-animal configuration.
export type CharacterRig = {
  anchors: BodyAnchors;
  limbs: {
    leftArm: LimbConfig;
    rightArm: LimbConfig;
    leftLeg: LimbConfig;
    rightLeg: LimbConfig;
  };
  mouth: MouthConfig;
};

// --- Math: limbs ---------------------------------------------------------

// Compute the SVG path string for a limb's quadratic Bezier curve.
// Returns a path's `d` attribute string: "M ax ay Q cx cy ex ey".
export function limbPath(anchor: Point, state: LimbState, length: number): string {
  const rad = (state.endAngle * Math.PI) / 180;
  const end: Point = {
    x: anchor.x + Math.cos(rad) * length,
    y: anchor.y + Math.sin(rad) * length,
  };
  const mid: Point = {
    x: (anchor.x + end.x) / 2,
    y: (anchor.y + end.y) / 2,
  };
  const dx = end.x - anchor.x;
  const dy = end.y - anchor.y;
  // Unit perpendicular to the shoulder→end direction.
  const perpX = -dy / length;
  const perpY = dx / length;
  const control: Point = {
    x: mid.x + perpX * state.bendAmount,
    y: mid.y + perpY * state.bendAmount,
  };
  return `M ${anchor.x} ${anchor.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

export function clampLimb(state: LimbState, config: LimbConfig): LimbState {
  return {
    endAngle: Math.max(config.angleMin, Math.min(config.angleMax, state.endAngle)),
    bendAmount: Math.max(-config.bendMax, Math.min(config.bendMax, state.bendAmount)),
  };
}

// --- Math: mouth ---------------------------------------------------------

// Compute the SVG path string for the mouth arc.
//   center: position of the mouth's ellipse center (the anchor).
//   state:  width, height, startAngle, sweepAngle.
// Returns a path's `d` attribute string using the A (elliptical arc) command.
export function mouthPath(center: Point, state: MouthState): string {
  const rx = state.width / 2;
  const ry = state.height / 2;

  const startRad = (state.startAngle * Math.PI) / 180;
  const endRad = ((state.startAngle + state.sweepAngle) * Math.PI) / 180;

  const start: Point = {
    x: center.x + rx * Math.cos(startRad),
    y: center.y + ry * Math.sin(startRad),
  };
  const end: Point = {
    x: center.x + rx * Math.cos(endRad),
    y: center.y + ry * Math.sin(endRad),
  };

  const absSweep = Math.abs(state.sweepAngle);
  const largeArcFlag = absSweep > 180 ? 1 : 0;
  const sweepFlag = state.sweepAngle > 0 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${rx} ${ry} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

export function clampMouth(state: MouthState, config: MouthConfig): MouthState {
  return {
    width: Math.max(config.widthMin, Math.min(config.widthMax, state.width)),
    height: Math.max(config.heightMin, Math.min(config.heightMax, state.height)),
    startAngle: state.startAngle,
    sweepAngle: state.sweepAngle,
  };
}

// --- Defaults ------------------------------------------------------------

// Default smile: flat top across the diameter, curving down beneath.
export const DEFAULT_MOUTH: MouthState = {
  width: 35,
  height: 25,
  startAngle: 0,    // right side of ellipse
  sweepAngle: 180,  // sweep clockwise across the bottom
};

// Neutral resting pose — limbs hang down, mouth smiling.
export const NEUTRAL_POSE: CharacterPose = {
  leftArm:  { endAngle: 100, bendAmount: 0 },
  rightArm: { endAngle: 80,  bendAmount: 0 },
  leftLeg:  { endAngle: 95,  bendAmount: 0 },
  rightLeg: { endAngle: 85,  bendAmount: 0 },
  mouth: DEFAULT_MOUTH,
};
