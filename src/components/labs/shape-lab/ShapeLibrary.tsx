// ShapeLibrary — flat list of saved shapes: a thumbnail, the name and
// source string, with edit / delete actions. "+ Make new shape" at the
// top is the always-available escape hatch out of any in-progress edit.

import React from "react";
import { Shape } from "../../../data/labs/shapes/grammar";
import { ShapeRenderer } from "./ShapeRenderer";

export type ShapeLibraryProps = {
  shapes: Shape[];
  editingId: string | null;
  onEdit: (shape: Shape) => void;
  onDelete: (shape: Shape) => void;
  onNew: () => void;
};

export function ShapeLibrary({
  shapes,
  editingId,
  onEdit,
  onDelete,
  onNew,
}: ShapeLibraryProps) {
  return (
    <aside className="lab__library">
      <h2 className="lab__library-title">Shape Library</h2>
      <button
        type="button"
        className="lab__new-artifact"
        onClick={onNew}
        title="Clear the form and start a fresh shape"
      >
        + Make new shape
      </button>
      {shapes.length === 0 ? (
        <div className="lab__library-empty">
          No shapes yet — compose one to start your collection.
        </div>
      ) : (
        shapes.map((shape) => (
          <div
            key={shape.id}
            className={
              "shape-card" +
              (editingId === shape.id ? " shape-card--editing" : "")
            }
          >
            <div className="shape-card__thumb">
              <ShapeRenderer
                source={shape.source}
                colorSeed={shape.colorSeed}
                size={44}
              />
            </div>
            <div className="shape-card__names">
              <div className="shape-card__name">{shape.name}</div>
              <div className="shape-card__source">{shape.source}</div>
            </div>
            <div className="shape-card__buttons">
              <button
                type="button"
                className="shape-card__btn"
                aria-label={`edit ${shape.name}`}
                onClick={() => onEdit(shape)}
                title="Edit"
              >
                ✎
              </button>
              <button
                type="button"
                className="shape-card__btn shape-card__btn--danger"
                aria-label={`delete ${shape.name}`}
                onClick={() => onDelete(shape)}
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        ))
      )}
    </aside>
  );
}
