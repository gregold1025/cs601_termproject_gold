// useMoveSequencer — the conductor.
//
// Plays no instrument: physics (motion) and articulation (form) are the
// musicians; the sequencer reads the score (a CommandToken[] from
// resolveCommandChain) and cues each engine at the right moment. It is
// the ONE place allowed to know both engines — coordination knowledge
// lives in the coordinator precisely so the coordinated parts can stay
// ignorant of each other.
//
// Two token kinds, two timing rules:
//   - MOVE tokens occupy a metronome slot. Their force impulse and
//     articulation cue fire on link start; the next link waits for the
//     slot to elapse before firing.
//   - SPAWN tokens are zero-cost on the metronome. They fire immediately
//     and the queue advances past them in the same beat, so a chain
//     like `move.spawn.spawn.move` plays move1, fires both spawns when
//     move1's slot ends, then plays move2 on a single metronome beat.
//     This keeps a launched move's landing-correction state alive across
//     intervening spawns (a spawn cannot overwrite `currentRef`).
//
// Two clocks:
//   - The SEQUENCE clock is a fixed metronome: each MOVE link occupies
//     MOVE_TEMPO / speed seconds, then the next move-or-end fires.
//     Chain faster than you fall and launches stack: that's a rule.
//   - The VISUAL clock can stretch: a launch's flip rides the arc. The
//     sequencer predicts the airtime from the impulse and hands the
//     articulator that longer window; if the body lands early, the
//     live-arc correction (watching real altitude every frame) tells
//     the articulator to finish, so the flip completes on landing.
//
// One force law: every saved force vector becomes a physics impulse via
// forceToImpulse — the same call in the lab and the playground.

import { useRef, useState } from "react";
import { useGameLoop } from "./useGameLoop";
import {
  Move,
  MOVE_TEMPO,
  forceToImpulse,
} from "../data/labs/dance-moves/dance";
import { Shape } from "../data/labs/shapes/grammar";
import { CommandToken } from "../data/command";
import { PHYSICS_DEFAULTS } from "./stepPhysics";
import { CharacterArticulation } from "./useCharacterArticulation";

export type SequencerDeps = {
  articulation: CharacterArticulation;
  // The physics hookup: a move's force vector fires through this at the
  // moment its link begins (not all-at-once on submit).
  applyImpulse: (vx: number, vy: number) => void;
  // Live altitude (negative = airborne) — read every frame for the
  // landing correction.
  getAltitude: () => number;
  // Fired when a chain link is a shape spawn. Required so a misconfigured
  // caller (omitting the callback) surfaces at compile time rather than
  // silently dropping spawn events at runtime.
  onSpawnSticker: (shape: Shape) => void;
  gravity?: number; // must match the physics world's gravity
  tempo?: number; // seconds per move slot at speed 1
};

export type MoveSequencer = {
  isPlaying: boolean;
  // Run a resolved chain (a bare command is a one-link chain). Tokens
  // can be moves or shape spawns; spawns fire instantly, moves occupy
  // a metronome slot. Interrupt semantics: discards whatever was
  // playing or queued.
  runChain: (tokens: CommandToken[]) => void;
  stop: () => void;
};

type Current = {
  start: number; // ms
  slot: number; // s — this link's share of the metronome
  launched: boolean; // had an upward impulse
  wasAirborne: boolean;
  landed: boolean;
};

// Exhaustiveness guard for the CommandToken switch. A new token variant
// added to the union without a handler here triggers a compile error.
function assertNever(value: never): never {
  throw new Error(
    `useMoveSequencer: unhandled CommandToken variant: ${JSON.stringify(value)}`,
  );
}

export function useMoveSequencer(deps: SequencerDeps): MoveSequencer {
  const {
    articulation,
    applyImpulse,
    getAltitude,
    onSpawnSticker,
    gravity = PHYSICS_DEFAULTS.gravity,
    tempo = MOVE_TEMPO,
  } = deps;

  const currentRef = useRef<Current | null>(null);
  const queueRef = useRef<CommandToken[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Run a move link: fire its impulse, cue articulation, start the
  // metronome with the move's slot (and a possibly-longer visual
  // window for launches).
  const beginMove = (move: Move) => {
    let launched = false;
    let predictedAirtime = 0;

    if (move.forceVector) {
      const impulse = forceToImpulse(move.forceVector);
      applyImpulse(impulse.x, impulse.y);
      if (impulse.y < 0) {
        launched = true;
        // Ballistic time for the upward component — how long the arc
        // lasts under pure gravity. The flip spreads across this.
        predictedAirtime = (2 * -impulse.y) / gravity;
      }
    }

    const slot = tempo / (move.speed || 1);
    const visualDuration = Math.max(slot, predictedAirtime);

    articulation.startMove({
      targetPose: move.targetPose,
      rotationY: move.rotationY ?? 0,
      rotationZ: move.rotationZ ?? 0,
      duration: visualDuration,
    });

    currentRef.current = {
      start: performance.now(),
      slot,
      launched,
      wasAirborne: false,
      landed: false,
    };
  };

  // Drain any leading shape tokens from the front of the array, firing
  // the spawn callback for each immediately. Returns the array sliced
  // past them. Used by both runChain (on submit) and the game-loop tick
  // (after a move's slot elapses) so shape spawns never consume
  // metronome time and never touch currentRef (preserving a prior
  // launched move's landing-correction state).
  const drainShapes = (tokens: CommandToken[]): CommandToken[] => {
    let i = 0;
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.type === "move") break;
      if (t.type === "shape") {
        onSpawnSticker(t.shape);
        i++;
        continue;
      }
      assertNever(t);
    }
    return i === 0 ? tokens : tokens.slice(i);
  };

  useGameLoop(() => {
    const cur = currentRef.current;
    if (!cur) return;

    // Live-arc landing correction: once the body has actually left the
    // ground and come back, complete the flip — even if the predicted
    // airtime hasn't elapsed (interruptions, early landings).
    if (cur.launched && !cur.landed) {
      const y = getAltitude();
      if (y < -2) {
        cur.wasAirborne = true;
      } else if (cur.wasAirborne && y >= 0) {
        cur.landed = true;
        articulation.finishEarly();
      }
    }

    // The metronome: when this link's slot elapses, fire intervening
    // shape spawns and then the next move (or terminate).
    const elapsed = (performance.now() - cur.start) / 1000;
    if (elapsed >= cur.slot) {
      queueRef.current = drainShapes(queueRef.current);
      const next = queueRef.current.shift();
      if (next) {
        // After drainSpawns the head is necessarily a move.
        if (next.type === "move") beginMove(next.move);
        else assertNever(next.type as never);
      } else if (!articulation.isAnimating) {
        // Chain exhausted and the visual has fully played out.
        currentRef.current = null;
        setIsPlaying(false);
      }
    }
  });

  return {
    isPlaying,
    runChain: (tokens) => {
      if (tokens.length === 0) return;
      // Drain leading shape spawns immediately. If nothing remains, the
      // chain was shape-only — nothing to time; we already fired
      // everything.
      const remaining = drainShapes(tokens);
      if (remaining.length === 0) return;
      const first = remaining[0];
      if (first.type !== "move") {
        // Unreachable: drainShapes guarantees the head is a move.
        assertNever(first.type as never);
      }
      queueRef.current = remaining.slice(1);
      beginMove(first.move);
      setIsPlaying(true);
    },
    stop: () => {
      queueRef.current = [];
      currentRef.current = null;
      setIsPlaying(false);
    },
  };
}
