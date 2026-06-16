// LabSelection — persistent strip at the bottom of the playground.
// Hosts a column with a "Command Labs" section label on top and a row
// of cards below, one per artifact lab. Each card opens its lab.
// Future labs replace the "Coming Soon" placeholders.

import React from "react";
import "./LabSelection.css";

export type LabSelectionProps = {
  onOpenDanceLab: () => void;
  onOpenShapeLab: () => void;
};

export function LabSelection({
  onOpenDanceLab,
  onOpenShapeLab,
}: LabSelectionProps) {
  return (
    <div className="lab-selection">
      <div className="lab-selection__title">Command Labs</div>
      <div className="lab-selection__row">
        <button
          type="button"
          onClick={onOpenDanceLab}
          className="lab-selection__card"
        >
          <span className="lab-selection__card-label">Dance Lab</span>
        </button>
        <button
          type="button"
          onClick={onOpenShapeLab}
          className="lab-selection__card"
        >
          <span className="lab-selection__card-label">Shape Lab</span>
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="lab-selection__card lab-selection__card--disabled"
        >
          <span className="lab-selection__card-label">Drum Lab</span>
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="lab-selection__card lab-selection__card--disabled"
        >
          <span className="lab-selection__card-label">Force Lab</span>
        </button>
      </div>
    </div>
  );
}
