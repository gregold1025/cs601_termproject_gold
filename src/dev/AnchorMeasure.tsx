// Dev-only tool for measuring body anchors on each animal SVG.
// Usage:
//   1. Pick an animal from the dropdown.
//   2. Click an anchor name in the left panel (or use the auto-advance).
//   3. Click on the rendered SVG where that anchor should be.
//   4. Repeat for all five anchors.
//   5. Hit "Copy as TS" to copy a typed object to your clipboard.
//   6. Paste into the animal's rig config file.
//
// Coordinates are converted from screen pixels back to the SVG's viewBox
// space via getScreenCTM().inverse(), so the values are stable regardless
// of how the SVG is sized on screen.

import React, { useRef, useState } from "react";
import { ReactComponent as Bear } from "../assets/animals/BEAR.svg";
import { ReactComponent as Lion } from "../assets/animals/LION.svg";
import { ReactComponent as Monkey } from "../assets/animals/MONKEY.svg";
import { ReactComponent as Pig } from "../assets/animals/PIG.svg";

const ANIMAL_SVGS = { bear: Bear, pig: Pig, lion: Lion, monkey: Monkey } as const;
type AnimalKey = keyof typeof ANIMAL_SVGS;

const ANCHORS = ["leftShoulder", "rightShoulder", "leftHip", "rightHip", "mouth"] as const;
type AnchorKey = (typeof ANCHORS)[number];

type Measured = Record<AnchorKey, { x: number; y: number } | null>;

const EMPTY: Measured = {
  leftShoulder: null,
  rightShoulder: null,
  leftHip: null,
  rightHip: null,
  mouth: null,
};

export function AnchorMeasure() {
  const [animal, setAnimal] = useState<AnimalKey>("bear");
  const [active, setActive] = useState<AnchorKey>(ANCHORS[0]);
  const [measured, setMeasured] = useState<Measured>(EMPTY);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    const rounded = { x: Math.round(p.x), y: Math.round(p.y) };

    setMeasured((prev) => ({ ...prev, [active]: rounded }));

    // Auto-advance to the next unset anchor.
    const remaining = ANCHORS.filter((a) => a !== active && !measured[a]);
    if (remaining.length > 0) setActive(remaining[0]);
  };

  const copyAsTs = () => {
    const lines = ANCHORS.map((a) => {
      const v = measured[a];
      return `    ${a}: { x: ${v?.x ?? 0}, y: ${v?.y ?? 0} },`;
    });
    const obj =
      `// Measured anchors for ${animal}\n` +
      `const ${animal.toUpperCase()}_ANCHORS: BodyAnchors = {\n` +
      lines.join("\n") +
      `\n};`;
    navigator.clipboard.writeText(obj);
  };

  const reset = () => {
    setMeasured(EMPTY);
    setActive(ANCHORS[0]);
  };

  const switchAnimal = (next: AnimalKey) => {
    setAnimal(next);
    reset();
  };

  const SvgComponent = ANIMAL_SVGS[animal];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <label htmlFor="animal-select">Animal:</label>
        <select
          id="animal-select"
          value={animal}
          onChange={(e) => switchAnimal(e.target.value as AnimalKey)}
        >
          {(Object.keys(ANIMAL_SVGS) as AnimalKey[]).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button onClick={copyAsTs}>Copy as TS</button>
        <button onClick={reset}>Reset</button>
        <span style={{ color: "#666", fontSize: 13 }}>
          Click an anchor on the left, then click the SVG to set it.
        </span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div
          style={{
            width: 260,
            padding: 12,
            borderRight: "1px solid #ddd",
            fontFamily: "ui-monospace, monospace",
            fontSize: 13,
          }}
        >
          {ANCHORS.map((a) => {
            const isActive = a === active;
            const v = measured[a];
            return (
              <div
                key={a}
                onClick={() => setActive(a)}
                style={{
                  padding: "8px 10px",
                  marginBottom: 6,
                  background: isActive ? "#fff4d6" : "transparent",
                  borderLeft: isActive
                    ? "3px solid #ff9900"
                    : "3px solid transparent",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {a}
                  {isActive ? "  ←" : ""}
                </div>
                <div style={{ color: v ? "#222" : "#999", marginTop: 2 }}>
                  {v ? `(${v.x}, ${v.y})` : "—"}
                </div>
              </div>
            );
          })}
        </div>

        <div
          ref={containerRef}
          onClick={handleClick}
          style={{
            flex: 1,
            overflow: "auto",
            padding: 24,
            background: "#f7f7f7",
            cursor: "crosshair",
          }}
        >
          <SvgComponent
            style={{
              maxWidth: "100%",
              height: "auto",
              display: "block",
              margin: "0 auto",
            }}
          />
        </div>
      </div>
    </div>
  );
}
