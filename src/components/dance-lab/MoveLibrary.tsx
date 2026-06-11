// MoveLibrary — flat list of saved moves with play / edit / delete actions.

import React from "react";
import { Move } from "../../data/characters/dance";

export type MoveLibraryProps = {
  moves: Move[];
  editingId: string | null;
  onPlay: (move: Move) => void;
  onEdit: (move: Move) => void;
  onDelete: (move: Move) => void;
  // Start a fresh draft — the always-available escape hatch out of any
  // in-progress edit.
  onNew: () => void;
};

export function MoveLibrary({
  moves,
  editingId,
  onPlay,
  onEdit,
  onDelete,
  onNew,
}: MoveLibraryProps) {
  return (
    <aside className="dance-lab__library">
      <h2 className="dance-lab__library-title">Move Library</h2>
      <button
        type="button"
        className="dance-lab__new-move"
        onClick={onNew}
        title="Clear the form and start a fresh move"
      >
        + Make new move
      </button>
      {moves.length === 0 ? (
        <div className="dance-lab__library-empty">
          No moves yet — save one to start your dictionary.
        </div>
      ) : (
        moves.map((move) => (
          <div
            key={move.id}
            className={
              "move-card" +
              (editingId === move.id ? " move-card--editing" : "")
            }
          >
            <div className="move-card__names">
              <div className="move-card__primary">{move.primary}</div>
              {move.secondary && (
                <div className="move-card__secondary">{move.secondary}</div>
              )}
            </div>
            <div className="move-card__buttons">
              <button
                type="button"
                className="move-card__btn"
                aria-label={`play ${move.primary}`}
                onClick={() => onPlay(move)}
                title="Play"
              >
                ▶
              </button>
              <button
                type="button"
                className="move-card__btn"
                aria-label={`edit ${move.primary}`}
                onClick={() => onEdit(move)}
                title="Edit"
              >
                ✎
              </button>
              <button
                type="button"
                className="move-card__btn move-card__btn--danger"
                aria-label={`delete ${move.primary}`}
                onClick={() => onDelete(move)}
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
