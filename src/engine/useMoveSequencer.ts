// useMoveSequencer — the conductor.
//
// Plays no instrument: physics (motion) and articulation (form) are the
// musicians; the sequencer reads the score (a Move[] from
// resolveCommandChain) and cues each engine at the right moment. It is
// the ONE place allowed to know both engines — coordination knowledge
// lives in the coordinator precisely so the coordinated parts can stay
// ignorant of each other.
//
// Two clocks:
//   - The SEQUENCE clock is a fixed metronome: each move occupies
//     MOVE_TEMPO / speed seconds, then the next chain link fires —
//     deterministic, regardless of what the body is doing. Chain faster
//     than you fall and launches stack: that's a rule, not an accident.
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
import { Move, MOVE_TEMPO, forceToImpulse } from "../data/characters/dance";
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
  gravity?: number; // must match the physics world's gravity
  tempo?: number; // seconds per move slot at speed 1
};

export type MoveSequencer = {
  isPlaying: boolean;
  // Run a resolved chain (a bare command is a one-link chain).
  // Interrupt semantics: discards whatever was playing or queued.
  runChain: (moves: Move[]) => void;
  stop: () => void;
};

type Current = {
  start: number; // ms
  slot: number; // s — this link's share of the metronome
  launched: boolean; // had an upward impulse
  wasAirborne: boolean;
  landed: boolean;
};

export function useMoveSequencer(deps: SequencerDeps): MoveSequencer {
  const {
    articulation,
    applyImpulse,
    getAltitude,
    gravity = PHYSICS_DEFAULTS.gravity,
    tempo = MOVE_TEMPO,
  } = deps;

  const currentRef = useRef<Current | null>(null);
  const queueRef = useRef<Move[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const begin = (move: Move) => {
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

    // The metronome: when this link's slot elapses, fire the next.
    const elapsed = (performance.now() - cur.start) / 1000;
    if (elapsed >= cur.slot) {
      const next = queueRef.current.shift();
      if (next) {
        begin(next);
      } else if (!articulation.isAnimating) {
        // Chain exhausted and the visual has fully played out.
        currentRef.current = null;
        setIsPlaying(false);
      }
    }
  });

  return {
    isPlaying,
    runChain: (moves) => {
      if (moves.length === 0) return;
      queueRef.current = moves.slice(1);
      begin(moves[0]);
      setIsPlaying(true);
    },
    stop: () => {
      queueRef.current = [];
      currentRef.current = null;
      setIsPlaying(false);
    },
  };
}
