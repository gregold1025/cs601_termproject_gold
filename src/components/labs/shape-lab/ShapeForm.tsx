// ShapeForm — the Shape Lab's two-field form: the grammar source and
// the shape's name. The source field filters to the three terminals as
// you type, and a live status line reports the parse state in the
// prototype's colors (green valid / yellow incomplete / red invalid).

import React from "react";
import { ParseStatus } from "../../../data/labs/shapes/grammar";

export type ShapeFormProps = {
  name: string;
  source: string;
  status: ParseStatus;
  message: string;
  editing: boolean;
  canSave: boolean;
  // True when the typed name collides with a move or shape in the flat
  // command namespace. Surfaced as an inline error on the name field.
  nameTaken: boolean;
  onNameChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onSave: () => void;
  // Context-dependent reset: editing → revert to the saved shape;
  // new → clear the fields.
  onReset: () => void;
  // Reroll the color seed so the same shape paints with a fresh
  // palette pick. Sits next to onReset in a single flex row.
  onReroll: () => void;
};

export function ShapeForm({
  name,
  source,
  status,
  message,
  editing,
  canSave,
  nameTaken,
  onNameChange,
  onSourceChange,
  onSave,
  onReset,
  onReroll,
}: ShapeFormProps) {
  return (
    <form
      className="lab__form"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) onSave();
      }}
    >
      <div className="lab__form-row">
        <label htmlFor="shape-source">Grammar string (t · s · b)</label>
        <input
          id="shape-source"
          type="text"
          className="shape-lab__source"
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          placeholder="tsssb"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className={`shape-lab__status shape-lab__status--${status}`}>
          {message}
        </div>
      </div>

      <div className="lab__form-row">
        <label htmlFor="shape-name">
          Name
          {nameTaken && (
            <span className="lab__label-error">
              Already used in command namespace
            </span>
          )}
        </label>
        <input
          id="shape-name"
          type="text"
          className={nameTaken ? "lab__input--error" : ""}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="triangle"
          autoComplete="off"
        />
      </div>

      <div className="shape-lab__row">
        <button
          type="button"
          className="lab__reset"
          onClick={onReset}
          title={
            editing
              ? "Revert to this shape's saved string and name"
              : "Clear the form"
          }
        >
          ↻ Reset
        </button>
        <button
          type="button"
          className="shape-lab__reroll"
          onClick={onReroll}
          title="Pick a fresh random color assignment for this shape"
        >
          ↻ Reroll colors
        </button>
      </div>

      <div className="lab__form-actions">
        <button type="submit" className="lab__save" disabled={!canSave}>
          {editing ? "Update shape" : "Save shape"}
        </button>
      </div>
    </form>
  );
}
