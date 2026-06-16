// Shape artifact + the drum polygon grammar (pure layer).
//
// A Shape is a named string in the three-terminal drum grammar:
//   S → t E b      (t opens a polygon, b closes it)
//   E → ε | F E
//   F → s | S      (a feature is a plain side, or a whole nested shape)
//
// The recursion (F → S) is the type-2 core — nested polygons fold
// outward from the parent edge. The prototype's "macro" (template
// rebinding via a trailing b) is deliberately ABSENT: every b is a
// plain close. Naming and reuse live at the library layer, where
// they're legible, not inside the string.
//
// Vertices are never stored — a Shape persists only its source string
// and a color seed; geometry is recomputed from the source at render
// time, so the string stays the single source of truth.

import { Adjective } from "../../avatar";
import { ADJECTIVE_PALETTES } from "../../characters/palette";
import { newId } from "../../ids";

// --- Artifact -------------------------------------------------------------

export type Shape = {
  id: string;
  name: string;
  source: string; // the grammar string, only t/s/b
  colorSeed: number; // locks the random per-polygon palette assignment
};

export function newShapeId(): string {
  return newId("shape");
}

export function newColorSeed(): number {
  return Math.floor(Math.random() * 100000);
}

// Shared localStorage key for the shape library. Bump the version
// suffix on breaking shape changes.
export const SHAPE_LIBRARY_KEY = "ugp.shape-library.v1";

// --- Input filtering --------------------------------------------------------

// Strip everything but the three terminals (lowercased). The source
// field runs every keystroke through this, mirroring the command-input
// discipline: the string in the box is always a legal alphabet.
export function filterSource(raw: string): string {
  let out = "";
  const lower = raw.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i];
    if (c === "t" || c === "s" || c === "b") out += c;
  }
  return out;
}

// --- Parser -----------------------------------------------------------------

export type SideNode = { type: "side" };
export type PolygonNode = {
  type: "polygon";
  features: ShapeNode[];
  open: boolean;
};
export type ShapeNode = SideNode | PolygonNode;

export type ParseStatus = "empty" | "incomplete" | "invalid" | "valid";

export type ParseResult = {
  root: PolygonNode | null;
  status: ParseStatus;
  message: string;
};

// Stack-based parse of the grammar. No macro branch — every b closes
// the innermost open polygon, full stop.
export function parseGrammar(source: string): ParseResult {
  let root: PolygonNode | null = null;
  const stack: PolygonNode[] = [];
  let error: string | null = null;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === "t") {
      const poly: PolygonNode = { type: "polygon", features: [], open: true };
      if (stack.length === 0) {
        if (root !== null) {
          error = `unexpected t at position ${i} (a top-level polygon already exists)`;
          break;
        }
        root = poly;
      } else {
        stack[stack.length - 1].features.push(poly);
      }
      stack.push(poly);
    } else if (c === "s") {
      if (stack.length === 0) {
        error = (root === null ? "bare s at position " : "extra s at position ") + i;
        break;
      }
      stack[stack.length - 1].features.push({ type: "side" });
    } else if (c === "b") {
      if (stack.length === 0) {
        error = (root === null ? "bare b at position " : "extra b at position ") + i;
        break;
      }
      const top = stack.pop();
      if (top) top.open = false;
    } else {
      error = `unexpected character "${c}" at position ${i}`;
      break;
    }
  }

  if (error) return { root, status: "invalid", message: error };
  if (root === null)
    return { root: null, status: "empty", message: "press t to start a polygon" };
  if (stack.length > 0)
    return { root, status: "incomplete", message: "in progress — keep going" };
  return { root, status: "valid", message: "valid shape" };
}

// --- Geometry ---------------------------------------------------------------

export type Vec = { x: number; y: number };

export type RenderPolygon = {
  vertices: Vec[];
  // True when the polygon was explicitly closed with b — closed
  // polygons get a fill; open ones render as outline only.
  filled: boolean;
  // Pre-order index (= the order the t's appear in the source);
  // drives the per-polygon color assignment.
  index: number;
};

export type BBox = { minX: number; minY: number; maxX: number; maxY: number };

export type RenderResult = {
  polygons: RenderPolygon[];
  bbox: BBox | null;
};

// Layout constants — arbitrary units; the renderer auto-fits via bbox.
const CENTER: Vec = { x: 0, y: 0 };
const RADIUS = 110;

// Flatten the AST into render-ready polygons in one shared coordinate
// space. Parents come before children (paint order: children on top).
// Nested polygons grow off their parent edge, folding OUTWARD — away
// from the canvas center — so deep nesting doesn't overlap the parent.
export function computeRenderPolygons(root: PolygonNode | null): RenderResult {
  const polygons: RenderPolygon[] = [];
  const bbox: BBox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
  let nextIndex = 0;

  const walk = (node: PolygonNode, vertices: Vec[]) => {
    if (vertices.length === 0) return;
    const index = nextIndex++;
    polygons.push({ vertices, filled: !node.open, index });
    for (const v of vertices) {
      if (v.x < bbox.minX) bbox.minX = v.x;
      if (v.x > bbox.maxX) bbox.maxX = v.x;
      if (v.y < bbox.minY) bbox.minY = v.y;
      if (v.y > bbox.maxY) bbox.maxY = v.y;
    }

    const n = node.features.length;
    const edgeCount = n >= 3 ? n : vertices.length - 1;
    for (let i = 0; i < Math.min(n, edgeCount); i++) {
      const f = node.features[i];
      if (f.type !== "polygon") continue;
      const v1 = vertices[i];
      const v2 = n >= 3 ? vertices[(i + 1) % n] : vertices[i + 1];
      const nestedN = f.features.length;
      let nestedVerts: Vec[] | null = null;
      if (nestedN >= 3) nestedVerts = nestedVertices(nestedN, v1, v2, CENTER);
      else if (nestedN > 0)
        nestedVerts = partialNestedVertices(nestedN, v1, v2, CENTER);
      if (nestedVerts) walk(f, nestedVerts);
    }
  };

  if (root) {
    const n = root.features.length;
    let vertices: Vec[] = [];
    if (n >= 3) vertices = regularVertices(n, CENTER, RADIUS);
    else if (n >= 1) vertices = openTopLevelVertices(n, CENTER, RADIUS);
    walk(root, vertices);
  }

  return {
    polygons,
    bbox: isFinite(bbox.minX) ? bbox : null,
  };
}

// A regular n-gon centered at c, first vertex pointing up.
function regularVertices(n: number, c: Vec, radius: number): Vec[] {
  const vs: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    vs.push({ x: c.x + radius * Math.cos(ang), y: c.y + radius * Math.sin(ang) });
  }
  return vs;
}

// One or two sides typed at the top level — not yet a polygon, drawn
// as an open path.
function openTopLevelVertices(n: number, c: Vec, sideLen: number): Vec[] {
  if (n === 1) {
    return [
      { x: c.x - sideLen / 2, y: c.y },
      { x: c.x + sideLen / 2, y: c.y },
    ];
  }
  if (n === 2) {
    return [
      { x: c.x - sideLen / 2, y: c.y + sideLen / 3 },
      { x: c.x + sideLen / 2, y: c.y + sideLen / 3 },
      { x: c.x + sideLen / 2, y: c.y - (sideLen * 2) / 3 },
    ];
  }
  return [];
}

// A nested regular n-gon sharing the parent edge v1→v2, folded to
// whichever side is farther from foldRef (the canvas center) so it
// grows outward.
function nestedVertices(n: number, v1: Vec, v2: Vec, foldRef: Vec): Vec[] {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const L = Math.sqrt(dx * dx + dy * dy);
  let hx = dx / L;
  let hy = dy / L;
  const exteriorAngle = (2 * Math.PI) / n;

  const candA = rotateAdvance(hx, hy, exteriorAngle, v2, L);
  const candB = rotateAdvance(hx, hy, -exteriorAngle, v2, L);
  const dA = (candA.x - foldRef.x) ** 2 + (candA.y - foldRef.y) ** 2;
  const dB = (candB.x - foldRef.x) ** 2 + (candB.y - foldRef.y) ** 2;
  const turnAngle = (dA > dB ? 1 : -1) * exteriorAngle;

  const vertices: Vec[] = [
    { x: v1.x, y: v1.y },
    { x: v2.x, y: v2.y },
  ];
  let curr = { x: v2.x, y: v2.y };
  for (let i = 0; i < n - 2; i++) {
    const cosA = Math.cos(turnAngle);
    const sinA = Math.sin(turnAngle);
    const nhx = hx * cosA - hy * sinA;
    const nhy = hx * sinA + hy * cosA;
    hx = nhx;
    hy = nhy;
    curr = { x: curr.x + L * hx, y: curr.y + L * hy };
    vertices.push({ x: curr.x, y: curr.y });
  }
  return vertices;
}

// A nested polygon with only 1–2 sides so far — an in-progress path
// hanging off the parent edge.
function partialNestedVertices(n: number, v1: Vec, v2: Vec, foldRef: Vec): Vec[] {
  if (n === 1) {
    return [
      { x: v1.x, y: v1.y },
      { x: v2.x, y: v2.y },
    ];
  }
  if (n === 2) {
    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    const hx = dx / L;
    const hy = dy / L;
    const candA = rotateAdvance(hx, hy, Math.PI / 2, v2, L);
    const candB = rotateAdvance(hx, hy, -Math.PI / 2, v2, L);
    const dA = (candA.x - foldRef.x) ** 2 + (candA.y - foldRef.y) ** 2;
    const dB = (candB.x - foldRef.x) ** 2 + (candB.y - foldRef.y) ** 2;
    const v3 = dA > dB ? candA : candB;
    return [{ x: v1.x, y: v1.y }, { x: v2.x, y: v2.y }, v3];
  }
  return [];
}

function rotateAdvance(
  hx: number,
  hy: number,
  angle: number,
  from: Vec,
  L: number,
): Vec {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const nhx = hx * cosA - hy * sinA;
  const nhy = hx * sinA + hy * cosA;
  return { x: from.x + L * nhx, y: from.y + L * nhy };
}

// --- Color ------------------------------------------------------------------

const ADJECTIVES: Adjective[] = [
  "clever",
  "friendly",
  "brave",
  "strong",
  "loyal",
];

export type PolygonColors = { stroke: string; fill: string };

// Deterministic per-polygon palette pick: the same (seed, index) pair
// always lands on the same adjective palette, so a saved shape renders
// identically forever. Stroke = the palette's dark; fill = its light.
export function polygonFill(colorSeed: number, index: number): PolygonColors {
  const hash = Math.abs(colorSeed * 31 + index * 17 + 7);
  const palette = ADJECTIVE_PALETTES[ADJECTIVES[hash % ADJECTIVES.length]];
  return { stroke: palette.dark, fill: palette.light };
}
