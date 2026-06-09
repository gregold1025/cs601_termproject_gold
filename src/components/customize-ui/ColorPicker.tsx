// Color picker — top of playground, "in the sky".
// Flexbox of 5 small colored circles (one per adjective). Click to select.

import React from "react";
import { Adjective } from "../../data/avatar";
import { ADJECTIVE_PALETTES } from "../../data/palette";
import "./customize-ui.css";

const ADJECTIVES: Adjective[] = [
  "clever",
  "friendly",
  "brave",
  "strong",
  "loyal",
];

export type ColorPickerProps = {
  selected: Adjective;
  onSelect: (adjective: Adjective) => void;
};

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  return (
    <div className="cui-color-picker">
      {ADJECTIVES.map((adjective) => {
        const palette = ADJECTIVE_PALETTES[adjective];
        const isSelected = selected === adjective;
        const className = isSelected
          ? "cui-color-circle cui-color-circle--selected"
          : "cui-color-circle";
        return (
          <button
            key={adjective}
            type="button"
            aria-label={adjective}
            aria-pressed={isSelected}
            onClick={() => onSelect(adjective)}
            className={className}
            style={{ background: palette.light }}
          />
        );
      })}
    </div>
  );
}
