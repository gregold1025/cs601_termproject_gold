// CommandHistory — floating console-log of submitted commands.
// Fixed bottom-left of the playground; each entry drifts upward and
// fades out via CSS animation. The runner prunes entries from state on
// the same clock, so the DOM never accumulates.

import React from "react";
import { HistoryEntry } from "../engine/useCommandRunner";
import "./CommandHistory.css";

export type CommandHistoryProps = {
  entries: HistoryEntry[];
};

export function CommandHistory({ entries }: CommandHistoryProps) {
  return (
    <div className="command-history" aria-live="polite">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`command-history__entry command-history__entry--${entry.status}`}
        >
          {entry.text}
        </div>
      ))}
    </div>
  );
}
