// ForceHandle — draggable handle for editing a Move's force vector.
// Renders a dashed line from the body center (centroid of the four
// shoulder/hip anchors) to a green handle.
//
// The handle is clamped to the inscribed circle of the character
// viewBox, so force magnitude is uniform in every direction; dragging
// within a small radius of the body center clears the vector (the
// gesture that means "no force").

import React, { useRef, useState } from "react";
import { Animal } from "../../data/avatar";
import { CharacterRig } from "../../data/characters/types";
import { characterDisplayBox } from "../Character";

type ForceVector = { x: number; y: number };

export type ForceHandleProps = {
  animal: Animal;
  rig: CharacterRig;
  forceVector?: ForceVector;
  onForceVectorChange: (next: ForceVector | undefined) => void;
  width?: number;
};

export function ForceHandle({
  animal,
  rig,
  forceVector,
  onForceVectorChange,
  width,
}: ForceHandleProps) {
  const { viewBox, display } = characterDisplayBox(animal, width);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null); // pointerId

  const bodyCenter = {
    x:
      (rig.anchors.leftShoulder.x +
        rig.anchors.rightShoulder.x +
        rig.anchors.leftHip.x +
        rig.anchors.rightHip.x) /
      4,
    y:
      (rig.anchors.leftShoulder.y +
        rig.anchors.rightShoulder.y +
        rig.anchors.leftHip.y +
        rig.anchors.rightHip.y) /
      4,
  };

  const forceHandlePos = forceVector
    ? { x: bodyCenter.x + forceVector.x, y: bodyCenter.y + forceVector.y }
    : bodyCenter;

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

  // Inscribed-circle radius of the character viewBox: the uniform cap
  // on force magnitude in every direction.
  const maxMagnitude = Math.min(viewBox.width, viewBox.height) / 2;

  const handleDrag = (svgPt: { x: number; y: number }) => {
    const dx = svgPt.x - bodyCenter.x;
    const dy = svgPt.y - bodyCenter.y;
    const mag = Math.hypot(dx, dy);

    // Snap back to "no force" when the user drags within a small radius
    // of the body center — the gesture that clears a force vector.
    if (mag < 6) {
      onForceVectorChange(undefined);
      return;
    }

    // Clamp to the inscribed circle, preserving the drag angle.
    if (mag > maxMagnitude) {
      const scale = maxMagnitude / mag;
      onForceVectorChange({ x: dx * scale, y: dy * scale });
    } else {
      onForceVectorChange({ x: dx, y: dy });
    }
  };

  const onPointerDown = (e: React.PointerEvent<SVGCircleElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (dragging === null || e.pointerId !== dragging) return;
    const svgPt = screenToSvg(e.clientX, e.clientY);
    if (!svgPt) return;
    handleDrag(svgPt);
  };

  const onPointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    if (dragging === null || e.pointerId !== dragging) return;
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
      {forceVector && (
        <line
          x1={bodyCenter.x}
          y1={bodyCenter.y}
          x2={forceHandlePos.x}
          y2={forceHandlePos.y}
          className="force-vector__line"
        />
      )}
      <circle
        cx={bodyCenter.x}
        cy={bodyCenter.y}
        r={3}
        className="force-vector__pivot"
      />
      <circle
        cx={forceHandlePos.x}
        cy={forceHandlePos.y}
        r={dragging !== null ? 14 : 11}
        className="pose-handle pose-handle--force"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </svg>
  );
}
