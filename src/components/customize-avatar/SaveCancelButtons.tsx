// Save / Cancel buttons — bottom-right of the playground.
// Visible WHEN in customize mode. Cancel reverts draft; Save commits it.

import React from "react";
import "./customize-ui.css";

export type SaveCancelButtonsProps = {
  onSave: () => void;
  onCancel: () => void;
};

export function SaveCancelButtons({ onSave, onCancel }: SaveCancelButtonsProps) {
  return (
    <div className="cui-save-cancel">
      <button
        type="button"
        onClick={onCancel}
        className="cui-button cui-cancel-button"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="cui-button cui-save-button"
      >
        Save
      </button>
    </div>
  );
}
