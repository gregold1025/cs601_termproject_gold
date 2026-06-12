// BottomBar — fixed strip at the bottom of the screen with cards for
// each artifact lab. Each card opens its lab; future labs append more
// cards.

import React from "react";
import "./BottomBar.css";

export type BottomBarProps = {
  onOpenDanceLab: () => void;
  onOpenShapeLab: () => void;
};

export function BottomBar({ onOpenDanceLab, onOpenShapeLab }: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <button
        type="button"
        onClick={onOpenDanceLab}
        className="bottom-bar__card"
      >
        <span className="bottom-bar__card-label">Dance Lab</span>
      </button>
      <button
        type="button"
        onClick={onOpenShapeLab}
        className="bottom-bar__card"
      >
        <span className="bottom-bar__card-label">Shape Lab</span>
      </button>
    </div>
  );
}
