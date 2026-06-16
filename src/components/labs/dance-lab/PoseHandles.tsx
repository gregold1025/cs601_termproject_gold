// PoseHandles — draggable overlay for editing a character's pose (limbs).
// The force vector has its own overlay (ForceHandle).
//
// Each limb has two handles: an endpoint (sets endAngle by rotating
// around the shoulder/hip) and a bend point (sets bendAmount by
// displacing the Bezier control point perpendicular to the limb).

import React, { useRef, useState } from "react";
import { Animal } from "../../../data/avatar";
import {
  CharacterPose,
  CharacterRig,
  LimbState,
} from "../../../data/characters/types";
import { characterDisplayBox } from "../../Character";

type LimbKey = "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
type HandleKind = "end" | "bend";

const LIMBS: LimbKey[] = ["leftArm", "rightArm", "leftLeg", "rightLeg"];

const ANCHOR_KEY: Record<
  LimbKey,
  "leftShoulder" | "rightShoulder" | "leftHip" | "rightHip"
> = {
  leftArm: "leftShoulder",
  rightArm: "rightShoulder",
  leftLeg: "leftHip",
  rightLeg: "rightHip",
};

export type PoseHandlesProps = {
  animal: Animal;
  rig: CharacterRig;
  pose: CharacterPose;
  onPoseChange: (next: CharacterPose) => void;
  width?: number;
};

export function PoseHandles({
  animal,
  rig,
  pose,
  onPoseChange,
  width,
}: PoseHandlesProps) {
  const { viewBox, display } = characterDisplayBox(animal, width);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{
    limb: LimbKey;
    kind: HandleKind;
    pointerId: number;
  } | null>(null);

  const limbEnd = (limb: LimbKey) => {
    const anchor = rig.anchors[ANCHOR_KEY[limb]];
    const length = rig.limbs[limb].length;
    const state = pose[limb];
    const rad = (state.endAngle * Math.PI) / 180;
    return {
      x: anchor.x + Math.cos(rad) * length,
      y: anchor.y + Math.sin(rad) * length,
    };
  };

  const limbBend = (limb: LimbKey) => {
    const anchor = rig.anchors[ANCHOR_KEY[limb]];
    const length = rig.limbs[limb].length;
    const state = pose[limb];
    const end = limbEnd(limb);
    const midX = (anchor.x + end.x) / 2;
    const midY = (anchor.y + end.y) / 2;
    const dx = end.x - anchor.x;
    const dy = end.y - anchor.y;
    const perpX = -dy / length;
    const perpY = dx / length;
    return {
      x: midX + perpX * state.bendAmount,
      y: midY + perpY * state.bendAmount,
    };
  };

  const screenToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(ctm.inverse());
  };

  const updateLimb = (limb: LimbKey, next: LimbState) => {
    onPoseChange({ ...pose, [limb]: next });
  };

  const handleEndDrag = (
    limb: LimbKey,
    svgPt: { x: number; y: number },
  ) => {
    const anchor = rig.anchors[ANCHOR_KEY[limb]];
    const config = rig.limbs[limb];
    const dx = svgPt.x - anchor.x;
    const dy = svgPt.y - anchor.y;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const center = (config.angleMin + config.angleMax) / 2;
    while (angle - center > 180) angle -= 360;
    while (angle - center < -180) angle += 360;
    const clamped = Math.max(
      config.angleMin,
      Math.min(config.angleMax, angle),
    );
    updateLimb(limb, { ...pose[limb], endAngle: clamped });
  };

  const handleBendDrag = (
    limb: LimbKey,
    svgPt: { x: number; y: number },
  ) => {
    const anchor = rig.anchors[ANCHOR_KEY[limb]];
    const config = rig.limbs[limb];
    const length = config.length;
    const state = pose[limb];
    const rad = (state.endAngle * Math.PI) / 180;
    const endX = anchor.x + Math.cos(rad) * length;
    const endY = anchor.y + Math.sin(rad) * length;
    const midX = (anchor.x + endX) / 2;
    const midY = (anchor.y + endY) / 2;
    const dxEnd = endX - anchor.x;
    const dyEnd = endY - anchor.y;
    const perpX = -dyEnd / length;
    const perpY = dxEnd / length;
    const offsetX = svgPt.x - midX;
    const offsetY = svgPt.y - midY;
    const bend = offsetX * perpX + offsetY * perpY;
    const clamped = Math.max(
      -config.bendMax,
      Math.min(config.bendMax, bend),
    );
    updateLimb(limb, { ...pose[limb], bendAmount: clamped });
  };

  const onPointerDown = (
    e: React.PointerEvent<SVGCircleElement>,
    limb: LimbKey,
    kind: HandleKind,
  ) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({ limb, kind, pointerId: e.pointerId });
  };

  const onPointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    const svgPt = screenToSvg(e.clientX, e.clientY);
    if (!svgPt) return;
    if (dragging.kind === "end") handleEndDrag(dragging.limb, svgPt);
    else handleBendDrag(dragging.limb, svgPt);
  };

  const onPointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!dragging || e.pointerId !== dragging.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(null);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: display.width,
        height: display.height,
        pointerEvents: "none",
      }}
    >
      {LIMBS.map((limb) => {
        const end = limbEnd(limb);
        const bend = limbBend(limb);
        const isEndDragging =
          dragging?.limb === limb && dragging?.kind === "end";
        const isBendDragging =
          dragging?.limb === limb && dragging?.kind === "bend";
        return (
          <g key={limb}>
            <circle
              cx={bend.x}
              cy={bend.y}
              r={isBendDragging ? 12 : 9}
              className="pose-handle pose-handle--bend"
              onPointerDown={(e) => onPointerDown(e, limb, "bend")}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            <circle
              cx={end.x}
              cy={end.y}
              r={isEndDragging ? 14 : 11}
              className="pose-handle pose-handle--end"
              onPointerDown={(e) => onPointerDown(e, limb, "end")}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </g>
        );
      })}
    </svg>
  );
}
