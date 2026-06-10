// MoveForm — single form panel covering all editable fields of a Move.
// Pose state is driven by the on-character handles, not the form.

import React from "react";
import {
  SPEED_MIN,
  SPEED_MAX,
  ROTATION_Y_STEP,
  ROTATION_Z_STEP,
} from "../../data/characters/dance";

export type MoveFormProps = {
  primary: string;
  secondary: string;
  speed: number;
  rotationY: number;
  rotationZ: number;
  editing: boolean;
  canSave: boolean;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  onSpeedChange: (value: number) => void;
  onRotationYChange: (value: number) => void;
  onRotationZChange: (value: number) => void;
  onSave: () => void;
  onPlay: () => void;
  onResetOrientation: () => void;
  onCancelEdit: () => void;
};

export function MoveForm({
  primary,
  secondary,
  speed,
  rotationY,
  rotationZ,
  editing,
  canSave,
  onPrimaryChange,
  onSecondaryChange,
  onSpeedChange,
  onRotationYChange,
  onRotationZChange,
  onSave,
  onPlay,
  onResetOrientation,
  onCancelEdit,
}: MoveFormProps) {
  return (
    <form
      className="dance-editor__form"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) onSave();
      }}
    >
      <div className="dance-editor__form-row">
        <label htmlFor="move-primary">Primary command</label>
        <input
          id="move-primary"
          type="text"
          value={primary}
          onChange={(e) => onPrimaryChange(e.target.value)}
          placeholder="wave"
          autoComplete="off"
        />
      </div>
      <div className="dance-editor__form-row">
        <label htmlFor="move-secondary">Secondary command (optional)</label>
        <input
          id="move-secondary"
          type="text"
          value={secondary}
          onChange={(e) => onSecondaryChange(e.target.value)}
          placeholder="w"
          autoComplete="off"
        />
      </div>
      <div className="dance-editor__form-row">
        <label htmlFor="move-speed">
          Speed{" "}
          <span className="dance-editor__speed-value">
            {speed.toFixed(2)}×
          </span>
        </label>
        <input
          id="move-speed"
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={0.05}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
      </div>
      <div className="dance-editor__rotation-row">
        <div className="dance-editor__form-row">
          <label htmlFor="rot-y">Rotation Y (½ turns)</label>
          <input
            id="rot-y"
            type="number"
            step={ROTATION_Y_STEP}
            value={rotationY}
            onChange={(e) => onRotationYChange(Number(e.target.value) || 0)}
          />
        </div>
        <div className="dance-editor__form-row">
          <label htmlFor="rot-z">Rotation Z (turns)</label>
          <input
            id="rot-z"
            type="number"
            step={ROTATION_Z_STEP}
            value={rotationZ}
            onChange={(e) => onRotationZChange(Number(e.target.value) || 0)}
          />
        </div>
      </div>
      <button
        type="button"
        className="dance-editor__reset"
        onClick={onResetOrientation}
        title="Snap the character back to its upright resting orientation"
      >
        ↻ Reset orientation
      </button>
      <div className="dance-editor__form-actions">
        <button
          type="button"
          className="dance-editor__play"
          onClick={onPlay}
        >
          ▶ Play
        </button>
        {editing && (
          <button
            type="button"
            className="dance-editor__cancel-edit"
            onClick={onCancelEdit}
            title="Discard changes and start a fresh new move"
          >
            × Cancel edit
          </button>
        )}
        <button
          type="submit"
          className="dance-editor__save"
          disabled={!canSave}
        >
          {editing ? "Update move" : "Save move"}
        </button>
      </div>
    </form>
  );
}
