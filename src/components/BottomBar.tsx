// BottomBar — fixed strip at the bottom of the screen with cards for
// each artifact lab. For now there's only the Dance Lab; future
// artifact labs append more cards.

import React from "react";
import "./BottomBar.css";

export type BottomBarProps = {
  onOpenDanceLab: () => void;
};

export function BottomBar({ onOpenDanceLab }: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <button
        type="button"
        onClick={onOpenDanceLab}
        className="bottom-bar__card"
      >
        <span className="bottom-bar__card-label">Dance Lab</span>
      </button>
    </div>
  );
}
