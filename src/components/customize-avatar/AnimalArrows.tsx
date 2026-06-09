// Animal arrows — flank the character. Click cycles through the 4 animals.

import React from "react";
import { Animal } from "../../data/avatar";
import "./customize-ui.css";

const ANIMALS: Animal[] = ["bear", "pig", "lion", "monkey"];

function step(current: Animal, direction: -1 | 1): Animal {
  const idx = ANIMALS.indexOf(current);
  return ANIMALS[(idx + direction + ANIMALS.length) % ANIMALS.length];
}

export type AnimalArrowsProps = {
  selected: Animal;
  onSelect: (animal: Animal) => void;
};

export function AnimalArrows({ selected, onSelect }: AnimalArrowsProps) {
  return (
    <>
      <button
        type="button"
        aria-label="previous animal"
        onClick={() => onSelect(step(selected, -1))}
        className="cui-animal-arrow cui-animal-arrow--left"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <polygon points="12,2 2,7 12,12" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="next animal"
        onClick={() => onSelect(step(selected, 1))}
        className="cui-animal-arrow cui-animal-arrow--right"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <polygon points="2,2 12,7 2,12" fill="currentColor" />
        </svg>
      </button>
    </>
  );
}
