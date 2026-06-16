// seedDefaults — library seed for first-load demos.
//
// On a fresh visit (no library key written to localStorage yet), the
// move and shape libraries seed with these defaults so the playground
// is populated out of the gate. After that, the libraries operate by
// normal rules: edits persist, deletions stick. A user who clears the
// library down to empty stays empty on reload.
//
// The check is "key missing" vs. "key present" — an empty array is a
// present key, so a wiped library does NOT re-seed. To restore defaults
// after a wipe, remove the localStorage keys via DevTools.
//
// Defaults use stable IDs (move-default-*, shape-default-*) so a future
// re-seed of the same defaults stays idempotent.
//
// Lives in engine/ rather than data/ because seeding is a runtime side
// effect on localStorage, not pure data. Must run before any
// useLocalStorage initializer fires, so it's called at the top of
// src/index.tsx before ReactDOM.createRoot(...).render(...).

import { Move, MOVE_LIBRARY_KEY } from "../data/labs/dance-moves/dance";
import { Shape, SHAPE_LIBRARY_KEY } from "../data/labs/shapes/grammar";

// --- Defaults ---------------------------------------------------------------

// Jump and wave — captured from the authored library and dropped in
// verbatim with stable IDs.
export const DEFAULT_MOVES: Move[] = [
  {
    id: "move-default-jump",
    primary: "jump",
    secondary: "j",
    speed: 1,
    forceVector: { x: -0.8847347249286711, y: -297.99868664889533 },
    rotationY: 1,
    targetPose: {
      leftArm: { endAngle: 145.98882866721246, bendAmount: 10 },
      leftLeg: { endAngle: 95, bendAmount: 0 },
      mouth: { width: 35, height: 25, startAngle: 0, sweepAngle: 180 },
      rightArm: { endAngle: 37.76543922425284, bendAmount: -10 },
      rightLeg: { endAngle: 85, bendAmount: 0 },
    },
  },
  {
    id: "move-default-wave",
    primary: "wave",
    secondary: "w",
    speed: 1,
    targetPose: {
      leftArm: { endAngle: 193.9358488437149, bendAmount: -50 },
      leftLeg: { endAngle: 95, bendAmount: 0 },
      mouth: { width: 35, height: 25, startAngle: 0, sweepAngle: 180 },
      rightArm: { endAngle: 80, bendAmount: -10 },
      rightLeg: { endAngle: 85, bendAmount: 0 },
    },
  },
];

// Triangle, square, star — the three canonical shapes referenced in
// the documentation. Source strings follow the t/s/b grammar (t = open
// polygon, s = side, b = close). The star is an outer square whose
// four sides are each replaced by a nested triangle.
export const DEFAULT_SHAPES: Shape[] = [
  {
    id: "shape-default-triangle",
    name: "triangle",
    source: "tsssb",
    colorSeed: 17,
  },
  {
    id: "shape-default-square",
    name: "square",
    source: "tssssb",
    colorSeed: 91,
  },
  {
    id: "shape-default-star",
    name: "star",
    source: "ttsssbtsssbtsssbtsssbb",
    colorSeed: 42,
  },
];

// --- Seeding ----------------------------------------------------------------

export function seedDefaultLibraries(): void {
  if (typeof window === "undefined") return;
  seedIfMissing(MOVE_LIBRARY_KEY, DEFAULT_MOVES);
  seedIfMissing(SHAPE_LIBRARY_KEY, DEFAULT_SHAPES);
}

// Write defaults only when the storage key has never been set. A
// present-but-empty array means the user has wiped their library and
// gets to keep it wiped.
function seedIfMissing<T>(key: string, defaults: T[]): void {
  try {
    if (window.localStorage.getItem(key) !== null) return;
    window.localStorage.setItem(key, JSON.stringify(defaults));
  } catch {
    // Storage unavailable — skip silently.
  }
}
