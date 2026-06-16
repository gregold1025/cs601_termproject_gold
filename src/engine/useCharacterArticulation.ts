// useCharacterArticulation — the form engine (sibling of
// useCharacterPhysics, the motion engine).
//
// Owns HOW the character is shaped and oriented over time: limb/mouth
// pose tweening and whole-body rotation. It knows nothing about
// gravity, velocity, position, forces, or sequencing — it is a pure
// articulator: "tween this pose and this rotation over this many
// seconds." Anything that spans both engines (when to start a move,
// how long a launch's flip should ride the arc, when the next chain
// link fires) lives in useMoveSequencer, the conductor.
//
// Interruption is always graceful: every tween starts FROM the current
// values (value-based, not path-based), so a new move mid-flip
// interpolates from wherever the body currently is. End rotations are
// snapped via snapRotationForward, so an interrupted flip completes its
// turn rather than unwinding.
//
// Lifecycle of one move:
//   active    — pose tweens to target over the lead-in fraction, then
//               holds; rotation lerps start→end across the full window.
//   finishing — pose returns to base; rotation completes (a no-op
//               unless finishEarly cut the active phase short).
//   idle      — currentPose is null (renderers fall back to base);
//               rotation PERSISTS at its snapped end.

import { useRef, useState } from "react";
import { useGameLoop } from "./useGameLoop";
import {
  CharacterPose,
  LimbState,
  MouthState,
} from "../data/characters/types";
import {
  snapRotationForward,
  ROTATION_Y_STEP,
  ROTATION_Z_STEP,
} from "../data/labs/dance-moves/dance";

export type Rotation = { y: number; z: number }; // whole turns

// Fraction of the active window spent tweening into the target pose
// (the rest holds the pose).
const POSE_LEAD_IN = 0.25;
// How long the pose takes to return to base after a move completes.
const RETURN_DURATION = 0.3;
// Fast completion window when the sequencer reports an early landing.
const FINISH_DURATION = 0.2;

type Phase = {
  kind: "active" | "finishing";
  start: number; // ms (performance.now)
  duration: number; // s
  poseStart: CharacterPose;
  poseTarget: CharacterPose;
  rotationStart: Rotation;
  rotationEnd: Rotation;
};

export type ArticulationConfig = {
  basePose: CharacterPose;
};

export type StartMoveArgs = {
  targetPose?: CharacterPose;
  rotationY?: number; // delta, in turns
  rotationZ?: number;
  duration: number; // s — the visual window (the sequencer decides this)
};

export type CharacterArticulation = {
  isAnimating: boolean;
  currentPose: CharacterPose | null; // null = at base
  currentRotation: Rotation;
  startMove: (args: StartMoveArgs) => void;
  // Cut the active phase short and complete (pose home, rotation to its
  // snapped end) over a brief window — fired by the sequencer when the
  // body lands before the predicted arc finished.
  finishEarly: () => void;
  // Hard reset: clear any phase, pose to base, rotation to zero.
  reset: () => void;
};

export function useCharacterArticulation(
  config: ArticulationConfig,
): CharacterArticulation {
  const { basePose } = config;

  const phaseRef = useRef<Phase | null>(null);
  // Ref mirrors of the published state, so startMove/finishEarly called
  // from another hook's tick read exact current values, not a stale
  // render closure.
  const poseRef = useRef<CharacterPose | null>(null);
  const rotationRef = useRef<Rotation>({ y: 0, z: 0 });

  const [currentPose, setCurrentPose] = useState<CharacterPose | null>(null);
  const [currentRotation, setCurrentRotation] = useState<Rotation>({
    y: 0,
    z: 0,
  });

  const publish = (pose: CharacterPose | null, rotation: Rotation) => {
    poseRef.current = pose;
    rotationRef.current = rotation;
    setCurrentPose(pose);
    setCurrentRotation(rotation);
  };

  useGameLoop(() => {
    const phase = phaseRef.current;
    if (!phase) return;

    const elapsed = (performance.now() - phase.start) / 1000;
    const t = Math.min(1, elapsed / phase.duration);

    if (phase.kind === "active") {
      const poseT = Math.min(1, t / POSE_LEAD_IN);
      const pose = lerpPose(phase.poseStart, phase.poseTarget, poseT);
      const rotation: Rotation = {
        y: lerp(phase.rotationStart.y, phase.rotationEnd.y, t),
        z: lerp(phase.rotationStart.z, phase.rotationEnd.z, t),
      };
      publish(pose, rotation);

      if (t >= 1) {
        // Move complete — return the pose to base; rotation is already
        // at its end and simply holds through the finishing phase.
        phaseRef.current = {
          kind: "finishing",
          start: performance.now(),
          duration: RETURN_DURATION,
          poseStart: pose,
          poseTarget: basePose,
          rotationStart: rotation,
          rotationEnd: phase.rotationEnd,
        };
      }
      return;
    }

    // Finishing: pose home, rotation to its snapped end (no-op unless
    // finishEarly cut the flip short).
    const pose = lerpPose(phase.poseStart, phase.poseTarget, t);
    const rotation: Rotation = {
      y: lerp(phase.rotationStart.y, phase.rotationEnd.y, t),
      z: lerp(phase.rotationStart.z, phase.rotationEnd.z, t),
    };
    publish(pose, rotation);

    if (t >= 1) {
      phaseRef.current = null;
      // Idle: pose null (renderers fall back to base); rotation persists.
      publish(null, phase.rotationEnd);
    }
  });

  return {
    isAnimating: currentPose !== null,
    currentPose,
    currentRotation,

    startMove: (args) => {
      const rotationStart = { ...rotationRef.current };
      phaseRef.current = {
        kind: "active",
        start: performance.now(),
        duration: Math.max(0.05, args.duration),
        poseStart: poseRef.current ?? basePose,
        poseTarget: args.targetPose ?? basePose,
        rotationStart,
        rotationEnd: {
          y: snapRotationForward(
            rotationStart.y,
            args.rotationY ?? 0,
            ROTATION_Y_STEP,
          ),
          z: snapRotationForward(
            rotationStart.z,
            args.rotationZ ?? 0,
            ROTATION_Z_STEP,
          ),
        },
      };
    },

    finishEarly: () => {
      const phase = phaseRef.current;
      if (!phase || phase.kind !== "active") return;
      phaseRef.current = {
        kind: "finishing",
        start: performance.now(),
        duration: FINISH_DURATION,
        poseStart: poseRef.current ?? basePose,
        poseTarget: basePose,
        rotationStart: { ...rotationRef.current },
        rotationEnd: phase.rotationEnd,
      };
    },

    reset: () => {
      phaseRef.current = null;
      publish(null, { y: 0, z: 0 });
    },
  };
}

// --- Interpolation helpers ----------------------------------------------

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpLimb(a: LimbState, b: LimbState, t: number): LimbState {
  return {
    endAngle: lerp(a.endAngle, b.endAngle, t),
    bendAmount: lerp(a.bendAmount, b.bendAmount, t),
  };
}

function lerpMouth(a: MouthState, b: MouthState, t: number): MouthState {
  return {
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
    startAngle: lerp(a.startAngle, b.startAngle, t),
    sweepAngle: lerp(a.sweepAngle, b.sweepAngle, t),
  };
}

function lerpPose(
  a: CharacterPose,
  b: CharacterPose,
  t: number,
): CharacterPose {
  return {
    leftArm: lerpLimb(a.leftArm, b.leftArm, t),
    rightArm: lerpLimb(a.rightArm, b.rightArm, t),
    leftLeg: lerpLimb(a.leftLeg, b.leftLeg, t),
    rightLeg: lerpLimb(a.rightLeg, b.rightLeg, t),
    mouth: lerpMouth(a.mouth, b.mouth, t),
  };
}
