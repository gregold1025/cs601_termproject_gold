// BottomBar — fixed strip at the bottom of the screen with cards for
// each artifact editor. For now there's only the Dance editor; future
// artifact editors append more cards.

import React from "react";
import "./BottomBar.css";

export type BottomBarProps = {
  onOpenDanceEditor: () => void;
};

export function BottomBar({ onOpenDanceEditor }: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <button
        type="button"
        onClick={onOpenDanceEditor}
        className="bottom-bar__card"
      >
        <span className="bottom-bar__card-label">Dance Editor</span>
      </button>
    </div>
  );
}
