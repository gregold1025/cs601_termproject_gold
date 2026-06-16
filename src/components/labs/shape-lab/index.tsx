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
} from "../../../data/labs/shapes/grammar";
import { Move, MOVE_LIBRARY_KEY } from "../../../data/labs/dance-moves/dance";
import { isCommandTaken } from "../../../data/command";
import { useLocalStorage } from "../../../engine/useLocalStorage";
import { ShapeLibrary } from "./ShapeLibrary";
import { ShapeForm } from "./ShapeForm";
import { ShapeRenderer } from "./ShapeRenderer";
import "../lab.css";
import "./shape-lab.css";

const PREVIEW_SIZE = 360;

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
  const [library, setLibrary] = useLocalStorage<Shape[]>(SHAPE_LIBRARY_KEY, []);
  // Move library is read-only here — used for cross-library name
  // collision checks so a shape can't claim a name a move already owns.
  const [moveLibrary] = useLocalStorage<Move[]>(MOVE_LIBRARY_KEY, []);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  // Live parse — drives the preview, the status line, and Save.
  const parse = parseGrammar(draft.source);
  // Cross-library name collision check. Editing keeps its own shape's
  // name as not-a-collision; excludeMoveId is always null (the shape
  // lab never edits a move).
  const nameTaken = isCommandTaken(
    draft.name,
    moveLibrary,
    library,
    null,
    draft.editingId,
  );
  const canSave =
    draft.name.trim().length > 0 && parse.status === "valid" && !nameTaken;

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
    <div className="lab lab--shape shape-lab">
      <header className="lab__header">
        <button type="button" className="lab__back" onClick={onBack}>
          ← Back to playground
        </button>
        <span className="lab__title">Shape Lab</span>
      </header>

      <ShapeLibrary
        shapes={library}
        editingId={draft.editingId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNew={resetDraft}
      />

      <main className="lab__main">
        <div className="lab__stage">
          <ShapeRenderer
            source={draft.source}
            colorSeed={draft.colorSeed}
            size={PREVIEW_SIZE}
          />
        </div>

        <ShapeForm
          name={draft.name}
          source={draft.source}
          status={parse.status}
          message={parse.message}
          editing={draft.editingId !== null}
          canSave={canSave}
          nameTaken={nameTaken}
          onNameChange={(name) => setDraft({ ...draft, name })}
          onSourceChange={(raw) =>
            setDraft({ ...draft, source: filterSource(raw) })
          }
          onSave={handleSave}
          onReset={handleReset}
          onReroll={handleReroll}
        />

        <footer className="lab__footer">
          <a
            className="lab__footer-link"
            href="/documentation.html#shape-lab"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read more about the Shape Lab →
          </a>
        </footer>
      </main>
    </div>
  );
}
