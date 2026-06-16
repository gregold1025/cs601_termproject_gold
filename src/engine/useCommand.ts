// useCommand — owns the playground's command surface: the input string,
// submit logic, validity flash, and the self-pruning history list. The
// hook is multi-step inside (input state → resolve → dispatch → log +
// flash) but the consumer sees a single API.
//
// The consumer (PlaygroundView) connects:
//   - input/setInput to the CommandInput's controlled value
//   - submit() to the input's space/enter handler
//   - history to the CommandHistory panel
//   - flash to the input's outline state

import { useEffect, useRef, useState } from "react";
import { Move } from "../data/labs/dance-moves/dance";
import { Shape } from "../data/labs/shapes/grammar";
import { CommandToken, resolveCommandChain } from "../data/command";

// How long a history entry lives before being pruned (must match the
// CSS float-up animation duration so entries vanish as they fade out).
const HISTORY_LIFETIME_MS = 5000;

// How long the valid/invalid outline flash lasts on the input.
const FLASH_DURATION_MS = 450;

export type CommandStatus = "valid" | "invalid";

export type HistoryEntry = {
  id: number;
  text: string;
  status: CommandStatus;
};

export type Command = {
  input: string;
  setInput: (value: string) => void;
  submit: () => void;
  history: HistoryEntry[];
  flash: CommandStatus | null;
  inputFocused: boolean;
  setInputFocused: (focused: boolean) => void;
};

export function useCommand(
  moves: Move[],
  shapes: Shape[],
  // Receives the full resolved chain — one token for a bare command,
  // several for a dot-chained sequence ("mw.wm" or "triangle.mw").
  // Tokens may be moves or shapes; the sequencer dispatches by token type.
  onRunChain: (tokens: CommandToken[]) => void,
): Command {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [flash, setFlash] = useState<CommandStatus | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const nextIdRef = useRef(1);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pruneTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clear all pending timers on unmount.
  useEffect(() => {
    const pruneTimers = pruneTimersRef.current;
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      pruneTimers.forEach((t) => clearTimeout(t));
      pruneTimers.clear();
    };
  }, []);

  const submit = () => {
    const text = input.trim();
    if (!text) return;

    // Dot-chains resolve all-or-nothing: every segment must be a known
    // command or the whole input is invalid.
    const tokens = resolveCommandChain(text, moves, shapes);
    const status: CommandStatus = tokens ? "valid" : "invalid";

    if (tokens) onRunChain(tokens);

    // Append a history entry and schedule its own removal.
    const id = nextIdRef.current++;
    setHistory((prev) => [...prev, { id, text, status }]);
    const pruneTimer = setTimeout(() => {
      setHistory((prev) => prev.filter((e) => e.id !== id));
      pruneTimersRef.current.delete(pruneTimer);
    }, HISTORY_LIFETIME_MS);
    pruneTimersRef.current.add(pruneTimer);

    // Flash the input outline, then clear.
    setFlash(status);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), FLASH_DURATION_MS);

    setInput("");
  };

  return {
    input,
    setInput,
    submit,
    history,
    flash,
    inputFocused,
    setInputFocused,
  };
}
