// CommandInput — the fixed bottom-center command box on the playground.
// Spacebar (or Enter) executes the typed command. The runner's flash
// state drives a green/red outline for valid/invalid feedback.
// Escape blurs the field, returning the keyboard to character movement.

import React, { useEffect, useRef } from "react";
import { CommandStatus } from "../../engine/useCommand";
import "./CommandInput.css";

export type CommandInputProps = {
  value: string;
  flash: CommandStatus | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocusChange: (focused: boolean) => void;
};

export function CommandInput({
  value,
  flash,
  onChange,
  onSubmit,
  onFocusChange,
}: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount — typing commands is the primary interaction.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Keep keystrokes out of the window-level movement handler.
    e.stopPropagation();

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  const flashClass =
    flash === "valid"
      ? " command-input--valid"
      : flash === "invalid"
        ? " command-input--invalid"
        : "";

  return (
    <input
      ref={inputRef}
      type="text"
      className={"command-input" + flashClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      placeholder="type a command…"
      autoComplete="off"
      spellCheck={false}
      aria-label="command input"
    />
  );
}
