// Customize button — bottom-right of the playground.
// Visible when NOT in customize mode. Click enters customize mode.

import React from "react";
import "./customize-ui.css";

export type CustomizeButtonProps = {
  onClick: () => void;
};

export function CustomizeButton({ onClick }: CustomizeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cui-button cui-customize-button"
    >
      Customize
    </button>
  );
}
