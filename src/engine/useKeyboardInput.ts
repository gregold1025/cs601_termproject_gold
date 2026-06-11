// useKeyboardInput — maps keyboard events to action callbacks.
// Left/Right map to A/D, ArrowLeft/ArrowRight.
// Jump maps to W, ArrowUp, Space (and bails on key-repeat so holding doesn't spam).
// `disabled` short-circuits all handlers — useful while in customize mode.

import { useEffect, useRef } from "react";

export type KeyboardInputHandlers = {
  onLeftDown?: () => void;
  onLeftUp?: () => void;
  onRightDown?: () => void;
  onRightUp?: () => void;
  onJump?: () => void;
  disabled?: boolean;
};

export function useKeyboardInput(handlers: KeyboardInputHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (handlersRef.current.disabled) return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          handlersRef.current.onLeftDown?.();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          handlersRef.current.onRightDown?.();
          break;
        case " ":
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          if (!e.repeat) handlersRef.current.onJump?.();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Releasing a key must NEVER be suppressed, even while disabled.
      // Otherwise a key held before disable (e.g. focusing the command
      // box mid-walk) drops its keyup and the character drifts forever.
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          handlersRef.current.onLeftUp?.();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          handlersRef.current.onRightUp?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
}
