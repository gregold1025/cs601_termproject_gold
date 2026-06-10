// useMovePlayer — preview-time player for pose / transform / combined moves.
//
// Editor preview semantics:
//   - Gravity is on; the character starts on the ground (y=0) so it
//     doesn't fall when there's no force. Upward launches arc back to
//     the ground via gravity, matching how the move will look in the
//     playground.
//   - Vertical offset is clamped to y <= 0 so downward force has no
//     visible effect on a ground-resting character (the playground will
//     apply it when the character is airborne).
//   - Force vector is multiplied by FORCE_STRENGTH_MULTIPLIER at play
//     time and used as initial velocity (SVG units/sec).
//   - Flight duration is the larger of minFlightTime and the projectile's
//     ballistic time, so big upward launches get the whole arc.
//   - Rotation (in whole turns) lerps in linearly across the flight.
//   - Speed multiplier scales effective duration (higher = faster).
//
// On reset, the character lerps back to base pose and (0, 0, 0) over a
// short fixed window so the editor's preview returns home. The
// playground will use different reset semantics — see the design note.

import { useRef, useState } from "react";
import { useGameLoop } from "./useGameLoop";
import { CharacterPose, LimbState, MouthState } from "../data/characters/types";
import {
  FORCE_STRENGTH_MULTIPLIER,
  ROTATION_Y_STEP,
  ROTATION_Z_STEP,
} from "../data/characters/dance";

type ForceVector = { x: number; y: number };
type Rotation = { y: number; z: number }; // whole turns

type Phase = {
  state: "flying" | "resetting";
  flyingStart: number;
  resetStart?: number;
  endOffset?: ForceVector;
  endPose?: CharacterPose;
  basePose: CharacterPose;
  targetPose: CharacterPose;
  velocity: ForceVector;       // SVG units/sec, already strength-multiplied
  rotationStart: Rotation;     // value of currentRotation at play time
  rotationDelta: Rotation;     // whole turns to add over flight
  flyingDuration: number;      // seconds, scaled by speed
};

export type MovePlayerConfig = {
  basePose: CharacterPose;
  gravity?: number; // SVG units/sec^2 (default 1500)
  minFlightTime?: number; // seconds (default 0.6)
  resetDuration?: number; // seconds (default 0.3)
  poseLeadIn?: number; // fraction of flight to lerp pose in (default 0.25)
};

export type PlayArgs = {
  targetPose?: CharacterPose;
  forceVector?: ForceVector;
  rotationY?: number;
  rotationZ?: number;
  speed?: number;
};

export type MovePlayer = {
  isPlaying: boolean;
  currentPose: CharacterPose | null;
  currentOffset: ForceVector;
  currentRotation: Rotation;
  play: (args: PlayArgs) => void;
  resetOrientation: () => void;
};

export function useMovePlayer(config: MovePlayerConfig): MovePlayer {
  const {
    basePose,
    gravity = 1500,
    minFlightTime = 0.6,
    resetDuration = 0.3,
    poseLeadIn = 0.25,
  } = config;

  const phaseRef = useRef<Phase | null>(null);
  const [currentPose, setCurrentPose] = useState<CharacterPose | null>(null);
  const [currentOffset, setCurrentOffset] = useState<ForceVector>({
    x: 0,
    y: 0,
  });
  const [currentRotation, setCurrentRotation] = useState<Rotation>({
    y: 0,
    z: 0,
  });

  useGameLoop(() => {
    const phase = phaseRef.current;
    if (!phase) return;

    const nowMs = performance.now();

    if (phase.state === "flying") {
      const elapsed = (nowMs - phase.flyingStart) / 1000;

      // Position: kinematic + gravity (gravity = 0 in editor by default).
      // y clamped to <= 0 so downward force has no visible effect on the
      // ground-resting character.
      const rawY =
        phase.velocity.y * elapsed + 0.5 * gravity * elapsed * elapsed;
      const offset: ForceVector = {
        x: phase.velocity.x * elapsed,
        y: Math.min(0, rawY),
      };

      // Rotation lerps from its value at play start (rotationStart) toward
      // rotationStart + rotationDelta. The end value persists across plays
      // — no unwind during reset — because the form-enforced increments
      // (½ turn for Y, full turn for Z) always land on a visually stable
      // orientation.
      const rotT = Math.min(1, elapsed / phase.flyingDuration);
      const rotation: Rotation = {
        y: phase.rotationStart.y + phase.rotationDelta.y * rotT,
        z: phase.rotationStart.z + phase.rotationDelta.z * rotT,
      };

      // Pose lerps to target during lead-in fraction.
      const poseT = Math.min(1, elapsed / (phase.flyingDuration * poseLeadIn));
      const pose = lerpPose(phase.basePose, phase.targetPose, poseT);

      setCurrentOffset(offset);
      setCurrentRotation(rotation);
      setCurrentPose(pose);

      if (elapsed >= phase.flyingDuration) {
        phase.state = "resetting";
        phase.resetStart = nowMs;
        phase.endOffset = offset;
        phase.endPose = pose;
      }
      return;
    }

    // Resetting.
    // Pose and position lerp back to base / origin over a short window.
    // Rotation is NOT lerped back — it holds at its end-of-flight value.
    const resetElapsed = (nowMs - (phase.resetStart ?? nowMs)) / 1000;
    const t = Math.min(1, resetElapsed / resetDuration);
    const startOffset = phase.endOffset ?? { x: 0, y: 0 };
    const startPose = phase.endPose ?? phase.targetPose;

    setCurrentOffset({
      x: lerp(startOffset.x, 0, t),
      y: lerp(startOffset.y, 0, t),
    });
    setCurrentPose(lerpPose(startPose, phase.basePose, t));

    if (t >= 1) {
      phaseRef.current = null;
      setCurrentPose(null);
      setCurrentOffset({ x: 0, y: 0 });
      // Rotation persists — next play uses the held value as its start.
    }
  });

  return {
    isPlaying: currentPose !== null,
    currentPose,
    currentOffset,
    currentRotation,
    play: (args) => {
      const targetPose = args.targetPose ?? basePose;
      const rawVelocity = args.forceVector ?? { x: 0, y: 0 };
      const velocity: ForceVector = {
        x: rawVelocity.x * FORCE_STRENGTH_MULTIPLIER,
        y: rawVelocity.y * FORCE_STRENGTH_MULTIPLIER,
      };
      const speed = args.speed ?? 1.0;
      // Give upward launches the time to complete their arc; horizontal
      // and downward launches use the minimum flight time. All scaled by
      // playback speed.
      const ballistic =
        gravity > 0 && velocity.y < 0 ? (-2 * velocity.y) / gravity : 0;
      const flyingDuration = Math.max(minFlightTime, ballistic) / speed;

      // Snap the end orientation to the nearest stable multiple of the
      // per-axis step. This means a play interrupted mid-spin still lands
      // upright (no drift from accumulated half-finished animations).
      const rotationStart = { ...currentRotation };
      const desiredDeltaY = args.rotationY ?? 0;
      const desiredDeltaZ = args.rotationZ ?? 0;
      const idealEndY = rotationStart.y + desiredDeltaY;
      const idealEndZ = rotationStart.z + desiredDeltaZ;
      const snappedEndY = Math.round(idealEndY / ROTATION_Y_STEP) * ROTATION_Y_STEP;
      const snappedEndZ = Math.round(idealEndZ / ROTATION_Z_STEP) * ROTATION_Z_STEP;
      const rotationDelta: Rotation = {
        y: snappedEndY - rotationStart.y,
        z: snappedEndZ - rotationStart.z,
      };

      phaseRef.current = {
        state: "flying",
        flyingStart: performance.now(),
        basePose,
        targetPose,
        velocity,
        rotationStart,
        rotationDelta,
        flyingDuration,
      };
    },
    resetOrientation: () => {
      // Manual failsafe: cancel any in-flight animation and snap the
      // character back to its rest position. Used when the orientation
      // has drifted somewhere unexpected (e.g. mid-animation, an unusual
      // typed rotation value, etc.).
      phaseRef.current = null;
      setCurrentPose(null);
      setCurrentOffset({ x: 0, y: 0 });
      setCurrentRotation({ y: 0, z: 0 });
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
