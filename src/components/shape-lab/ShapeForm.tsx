// ShapeForm — the Shape Lab's two-field form: the grammar source and
// the shape's name. The source field filters to the three terminals as
// you type, and a live status line reports the parse state in the
// prototype's colors (green valid / yellow incomplete / red invalid).

import React from "react";
import { ParseStatus } from "../../data/shapes/grammar";

export type ShapeFormProps = {
  name: string;
  source: string;
  status: ParseStatus;
  message: string;
  editing: boolean;
  canSave: boolean;
  onNameChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onSave: () => void;
  // Context-dependent reset: editing → revert to the saved shape;
  // new → clear the fields.
  onReset: () => void;
};

export function ShapeForm({
  name,
  source,
  status,
  message,
  editing,
  canSave,
  onNameChange,
  onSourceChange,
  onSave,
  onReset,
}: ShapeFormProps) {
  return (
    <form
      className="shape-lab__form"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) onSave();
      }}
    >
      <div className="shape-lab__form-row">
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

      <div className="shape-lab__form-row">
        <label htmlFor="shape-name">Name</label>
        <input
          id="shape-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="triangle"
          autoComplete="off"
        />
      </div>

      <button
        type="button"
        className="shape-lab__reset"
        onClick={onReset}
        title={
          editing
            ? "Revert to this shape's saved string and name"
            : "Clear the form"
        }
      >
        ↻ Reset
      </button>

      <div className="shape-lab__form-actions">
        <button type="submit" className="shape-lab__save" disabled={!canSave}>
          {editing ? "Update shape" : "Save shape"}
        </button>
      </div>
    </form>
  );
}
