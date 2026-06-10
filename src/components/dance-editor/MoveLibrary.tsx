// MoveLibrary — flat list of saved moves with play / edit / delete actions.

import React from "react";
import { Move } from "../../data/characters/dance";

export type MoveLibraryProps = {
  moves: Move[];
  editingId: string | null;
  onPlay: (move: Move) => void;
  onEdit: (move: Move) => void;
  onDelete: (move: Move) => void;
};

export function MoveLibrary({
  moves,
  editingId,
  onPlay,
  onEdit,
  onDelete,
}: MoveLibraryProps) {
  return (
    <aside className="dance-editor__library">
      <h2 className="dance-editor__library-title">Move Library</h2>
      {moves.length === 0 ? (
        <div className="dance-editor__library-empty">
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
