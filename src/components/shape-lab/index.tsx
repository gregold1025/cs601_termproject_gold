// ShapeLab — artifact editor for drum-grammar shapes. The second
// module built to the four-slot recipe (artifact type in data/, an
// editor view, a storage key, a socket): this round covers the first
// three slots only — composing and naming shapes into a library.
// Playground instantiation (the simulation socket) comes later.
//
// Compose a string in the three-terminal grammar, watch the live
// preview, name it, save it. Same draft → commit → enforce loop as the
// dance lab; the library persists under SHAPE_LIBRARY_KEY.

import React, { useState } from "react";
import {
  Shape,
  newShapeId,
  newColorSeed,
  filterSource,
  parseGrammar,
  SHAPE_LIBRARY_KEY,
} from "../../data/shapes/grammar";
import { useLocalStorage } from "../../engine/useLocalStorage";
import { ShapeLibrary } from "./ShapeLibrary";
import { ShapeForm } from "./ShapeForm";
import { ShapeRenderer } from "./ShapeRenderer";
import "./shape-lab.css";

const PREVIEW_SIZE = 420;

type Draft = {
  name: string;
  source: string;
  colorSeed: number;
  editingId: string | null;
};

const emptyDraft = (): Draft => ({
  name: "",
  source: "",
  colorSeed: newColorSeed(),
  editingId: null,
});

export type ShapeLabProps = {
  onBack: () => void;
};

export function ShapeLab({ onBack }: ShapeLabProps) {
  const [library, setLibrary] = useLocalStorage<Shape[]>(
    SHAPE_LIBRARY_KEY,
    [],
  );
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  // Live parse — drives the preview, the status line, and Save.
  const parse = parseGrammar(draft.source);
  const canSave = draft.name.trim().length > 0 && parse.status === "valid";

  const resetDraft = () => setDraft(emptyDraft());

  const handleSave = () => {
    if (!canSave) return;
    const payload: Omit<Shape, "id"> = {
      name: draft.name.trim(),
      source: draft.source,
      colorSeed: draft.colorSeed,
    };
    if (draft.editingId) {
      setLibrary((prev) =>
        prev.map((s) => (s.id === draft.editingId ? { ...s, ...payload } : s)),
      );
    } else {
      setLibrary((prev) => [...prev, { id: newShapeId(), ...payload }]);
    }
    resetDraft();
  };

  const handleEdit = (shape: Shape) => {
    setDraft({
      name: shape.name,
      source: shape.source,
      colorSeed: shape.colorSeed,
      editingId: shape.id,
    });
  };

  const handleDelete = (shape: Shape) => {
    setLibrary((prev) => prev.filter((s) => s.id !== shape.id));
    if (draft.editingId === shape.id) resetDraft();
  };

  // Context-dependent reset: editing → revert to the saved shape;
  // new → clear. If the source shape vanished mid-edit, fall through
  // to a clean draft (no ghost editingId).
  const handleReset = () => {
    if (draft.editingId) {
      const source = library.find((s) => s.id === draft.editingId);
      if (source) {
        handleEdit(source);
        return;
      }
    }
    resetDraft();
  };

  const handleReroll = () =>
    setDraft((d) => ({ ...d, colorSeed: newColorSeed() }));

  return (
    <div className="shape-lab">
      <header className="shape-lab__header">
        <button type="button" className="shape-lab__back" onClick={onBack}>
          ← Back to playground
        </button>
        <span className="shape-lab__title">Shape Lab</span>
      </header>

      <ShapeLibrary
        shapes={library}
        editingId={draft.editingId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNew={resetDraft}
      />

      <main className="shape-lab__main">
        <div className="shape-lab__stage">
          <ShapeRenderer
            source={draft.source}
            colorSeed={draft.colorSeed}
            size={PREVIEW_SIZE}
          />
        </div>

        <button
          type="button"
          className="shape-lab__reroll"
          onClick={handleReroll}
          title="Pick a fresh random color assignment for this shape"
        >
          ↻ Reroll colors
        </button>

        <ShapeForm
          name={draft.name}
          source={draft.source}
          status={parse.status}
          message={parse.message}
          editing={draft.editingId !== null}
          canSave={canSave}
          onNameChange={(name) => setDraft({ ...draft, name })}
          onSourceChange={(raw) =>
            setDraft({ ...draft, source: filterSource(raw) })
          }
          onSave={handleSave}
          onReset={handleReset}
        />
      </main>
    </div>
  );
}
