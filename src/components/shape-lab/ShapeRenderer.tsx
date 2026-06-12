// ShapeRenderer — pure SVG view of a drum-grammar string.
// Parses the source, flattens the AST into polygons, auto-fits the
// viewBox to the shape's bounding box, and paints each polygon with
// its deterministic adjective-palette colors. Used for both the big
// live preview and the small library thumbnails.
//
// Renders nothing (an empty placeholder box) when the source is empty
// or invalid. Incomplete shapes render in progress — open outlines,
// no fill — exactly like the lab's live typing experience expects.

import React from "react";
import {
  parseGrammar,
  computeRenderPolygons,
  polygonFill,
} from "../../data/shapes/grammar";

export type ShapeRendererProps = {
  source: string;
  colorSeed: number;
  size: number; // square display size in CSS px
};

const PADDING_FRACTION = 0.12;
const MIN_EXTENT = 60;

export function ShapeRenderer({ source, colorSeed, size }: ShapeRendererProps) {
  const { root, status } = parseGrammar(source);
  const { polygons, bbox } =
    status === "invalid"
      ? { polygons: [], bbox: null }
      : computeRenderPolygons(root);

  if (polygons.length === 0 || !bbox) {
    return (
      <div
        className="shape-renderer shape-renderer--empty"
        style={{ width: size, height: size }}
      />
    );
  }

  // Auto-fit: pad the bbox and use it as the viewBox. preserveAspectRatio
  // (default "meet") letterboxes non-square shapes inside the square svg.
  const w = Math.max(bbox.maxX - bbox.minX, MIN_EXTENT);
  const h = Math.max(bbox.maxY - bbox.minY, MIN_EXTENT);
  const pad = Math.max(w, h) * PADDING_FRACTION;
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  const viewBox = `${cx - w / 2 - pad} ${cy - h / 2 - pad} ${w + 2 * pad} ${h + 2 * pad}`;

  return (
    <svg
      className="shape-renderer"
      viewBox={viewBox}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {polygons.map((p) => {
        const colors = polygonFill(colorSeed, p.index);
        const points = p.vertices.map((v) => `${v.x},${v.y}`).join(" ");
        // 3+ vertices: a polygon outline (closed path); filled only when
        // the polygon was explicitly closed with b. Fewer: an open path.
        if (p.vertices.length >= 3) {
          return (
            <polygon
              key={p.index}
              points={points}
              fill={p.filled ? colors.fill : "none"}
              stroke={colors.stroke}
              strokeWidth={2.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        }
        return (
          <polyline
            key={p.index}
            points={points}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
