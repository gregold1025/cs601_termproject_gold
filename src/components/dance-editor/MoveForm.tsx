// MoveForm — single form panel covering all editable fields of a Move.
// Pose state is driven by the on-character handles, not the form.
//
// Name validation: command names live in one flat namespace (primary
// and secondary both resolve as commands), so on any save attempt the
// editor checks both fields against the library. A colliding field is
// highlighted light red with a hint next to its label. The secondary
// field is optional — empty is always fine; it's only validated when
// filled. (Same pattern as the optional-but-validated email field from
// the class form exercise.)

import React from "react";
import {
  SPEED_MIN,
  SPEED_MAX,
  ROTATION_Y_STEP,
  ROTATION_Z_STEP,
} from "../../data/characters/dance";

export type NameErrors = {
  primary: boolean;
  secondary: boolean;
};

export type MoveFormProps = {
  primary: string;
  secondary: string;
  speed: number;
  rotationY: number;
  rotationZ: number;
  editing: boolean;
  canSave: boolean;
  nameErrors: NameErrors;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  onSpeedChange: (value: number) => void;
  onRotationYChange: (value: number) => void;
  onRotationZChange: (value: number) => void;
  onSave: () => void;
  onSaveAsNew: () => void;
  onPlay: () => void;
  // Context-dependent reset: editing → revert draft to the saved move's
  // values; new move → return the ragdoll to the default pose.
  onResetPose: () => void;
};

export function MoveForm({
  primary,
  secondary,
  speed,
  rotationY,
  rotationZ,
  editing,
  canSave,
  nameErrors,
  onPrimaryChange,
  onSecondaryChange,
  onSpeedChange,
  onRotationYChange,
  onRotationZChange,
  onSave,
  onSaveAsNew,
  onPlay,
  onResetPose,
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
        <label htmlFor="move-primary">
          Primary command
          {nameErrors.primary && (
            <span className="dance-editor__label-error">
              Please select new name
            </span>
          )}
        </label>
        <input
          id="move-primary"
          type="text"
          className={nameErrors.primary ? "dance-editor__input--error" : ""}
          value={primary}
          onChange={(e) => onPrimaryChange(e.target.value)}
          placeholder="wave"
          autoComplete="off"
        />
      </div>
      <div className="dance-editor__form-row">
        <label htmlFor="move-secondary">
          Secondary command (optional)
          {nameErrors.secondary && (
            <span className="dance-editor__label-error">
              Please select new command
            </span>
          )}
        </label>
        <input
          id="move-secondary"
          type="text"
          className={nameErrors.secondary ? "dance-editor__input--error" : ""}
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
          <label htmlFor="rot-y">Rotation Y (turns)</label>
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
        onClick={onResetPose}
        title={
          editing
            ? "Revert all fields to this move's saved values"
            : "Return the ragdoll to the default pose"
        }
      >
        ↻ Reset pose
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
            className="dance-editor__save-as-new"
            onClick={onSaveAsNew}
            disabled={!canSave}
            title="Save these edits as a brand-new move (the original stays untouched)"
          >
            + Save as new Move
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
