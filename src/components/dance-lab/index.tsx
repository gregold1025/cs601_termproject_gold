// DanceLab — artifact editor. One Move per saved command, edited via
// on-character handles (pose limbs + force vector) plus a flat form
// (primary, secondary, speed, rotation Y, rotation Z).
//
// The character here is the SAME physics body as the playground — same
// engines, same constants, same launch behavior. The lab's one extra
// rule: when a move has finished playing AND the body is grounded and
// settled, it snaps back to center stage. No special-cased motion, no
// cosmetic offsets — physics is unanimous; only the going-home reset is
// lab-specific.

import React, { useEffect, useState } from "react";
import { Avatar } from "../../data/avatar";
import { CHARACTER_RIGS } from "../../data/characters";
import { ADJECTIVE_PALETTES } from "../../data/characters/palette";
import { NEUTRAL_POSE, CharacterPose } from "../../data/characters/types";
import {
  Move,
  newMoveId,
  isCommandTaken,
  SPEED_DEFAULT,
  MOVE_LIBRARY_KEY,
} from "../../data/characters/dance";
import { Character } from "../Character";
import { MoveLibrary } from "./MoveLibrary";
import { MoveForm, NameErrors } from "./MoveForm";
import { PoseHandles } from "./PoseHandles";
import { ForceHandle } from "./ForceHandle";
import { useCharacterPhysics } from "../../engine/useCharacterPhysics";
import { useCharacterArticulation } from "../../engine/useCharacterArticulation";
import { useMoveSequencer } from "../../engine/useMoveSequencer";
import { useLocalStorage } from "../../engine/useLocalStorage";
import "./dance-lab.css";

const CHARACTER_DISPLAY_WIDTH = 380;

type ForceVector = { x: number; y: number };

type Draft = {
  primary: string;
  secondary: string;
  speed: number;
  targetPose: CharacterPose;
  forceVector: ForceVector | undefined;
  rotationY: number;
  rotationZ: number;
  editingId: string | null;
};

const EMPTY_DRAFT: Draft = {
  primary: "",
  secondary: "",
  speed: SPEED_DEFAULT,
  targetPose: NEUTRAL_POSE,
  forceVector: undefined,
  rotationY: 0,
  rotationZ: 0,
  editingId: null,
};

export type DanceLabProps = {
  avatar: Avatar;
  onBack: () => void;
};

export function DanceLab({ avatar, onBack }: DanceLabProps) {
  const [library, setLibrary] = useLocalStorage<Move[]>(MOVE_LIBRARY_KEY, []);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  // The same engines as the playground — one motion model everywhere.
  const physics = useCharacterPhysics();
  const articulation = useCharacterArticulation({ basePose: NEUTRAL_POSE });
  const sequencer = useMoveSequencer({
    articulation,
    applyImpulse: physics.applyImpulse,
    getAltitude: () => physics.position.y,
  });

  // The lab's snap-home rule (three-part): the move is DONE playing,
  // the body is GROUNDED, and it has SETTLED (velocity ~0). A downward
  // force settles instantly but waits out the pose window; a horizontal
  // skid waits for friction to stop it; a launch waits until landing.
  useEffect(() => {
    if (
      !sequencer.isPlaying &&
      physics.resting &&
      (physics.position.x !== 0 || physics.position.y !== 0)
    ) {
      physics.teleport(0, 0);
    }
  }, [sequencer.isPlaying, physics]);

  const rig = CHARACTER_RIGS[avatar.animal];
  const palette = ADJECTIVE_PALETTES[avatar.adjective];

  const rotation = articulation.currentRotation;
  const transform = `translate(${physics.position.x}px, ${physics.position.y}px) rotateY(${rotation.y * 360}deg) rotateZ(${rotation.z * 360}deg)`;

  const displayPose = articulation.currentPose ?? draft.targetPose;

  const canSave = draft.primary.trim().length > 0;

  // Name-collision flags, set on a failed save attempt. Each clears as
  // soon as the user edits the offending field.
  const [nameErrors, setNameErrors] = useState<NameErrors>({
    primary: false,
    secondary: false,
  });
  const NO_ERRORS: NameErrors = { primary: false, secondary: false };

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setNameErrors(NO_ERRORS);
  };

  // Check the draft's names against the library. excludeId skips the
  // move being updated (keeping your own name isn't a collision);
  // pass null for save-as-new, where colliding with the source move's
  // name forces the user to pick a fresh one.
  const checkNames = (excludeId: string | null): NameErrors => ({
    primary: isCommandTaken(draft.primary, library, excludeId),
    secondary:
      draft.secondary.trim().length > 0 &&
      isCommandTaken(draft.secondary, library, excludeId),
  });

  const draftPayload = (): Omit<Move, "id"> => ({
    primary: draft.primary.trim(),
    secondary: draft.secondary.trim() || undefined,
    speed: draft.speed,
    targetPose: draft.targetPose,
    forceVector: draft.forceVector,
    rotationY: draft.rotationY || undefined,
    rotationZ: draft.rotationZ || undefined,
  });

  const handleSave = () => {
    if (!canSave) return;
    const errors = checkNames(draft.editingId);
    if (errors.primary || errors.secondary) {
      setNameErrors(errors);
      return;
    }
    const payload = draftPayload();
    if (draft.editingId) {
      setLibrary((prev) =>
        prev.map((m) =>
          m.id === draft.editingId ? { ...m, ...payload } : m,
        ),
      );
    } else {
      setLibrary((prev) => [...prev, { id: newMoveId(), ...payload }]);
    }
    resetDraft();
  };

  // Save the current edits as a brand-new move; the original stays as
  // it was. The names must be fresh — the source move's own names count
  // as collisions here, so the user is prompted to rename.
  const handleSaveAsNew = () => {
    if (!canSave) return;
    const errors = checkNames(null);
    if (errors.primary || errors.secondary) {
      setNameErrors(errors);
      return;
    }
    setLibrary((prev) => [...prev, { id: newMoveId(), ...draftPayload() }]);
    resetDraft();
  };

  const handleEdit = (move: Move) => {
    setNameErrors(NO_ERRORS);
    setDraft({
      primary: move.primary,
      secondary: move.secondary ?? "",
      speed: move.speed,
      targetPose: move.targetPose ?? NEUTRAL_POSE,
      forceVector: move.forceVector,
      rotationY: move.rotationY ?? 0,
      rotationZ: move.rotationZ ?? 0,
      editingId: move.id,
    });
  };

  // Stop any preview and bring the body + orientation home.
  const stopPreview = () => {
    sequencer.stop();
    articulation.reset();
    physics.teleport(0, 0);
  };

  // Context-dependent reset. Editing → revert the whole draft to the
  // saved move's values. New move → return the ragdoll (pose, force,
  // rotations) to defaults, keeping any typed names.
  const handleResetPose = () => {
    stopPreview();
    setNameErrors(NO_ERRORS);
    if (draft.editingId) {
      const source = library.find((m) => m.id === draft.editingId);
      if (source) {
        handleEdit(source);
        return;
      }
      // Source move vanished mid-edit — fall through to defaults, and
      // clear the dangling editingId so a later save creates a fresh
      // move instead of silently no-op-updating a ghost.
    }
    setDraft((d) => ({
      ...d,
      targetPose: NEUTRAL_POSE,
      forceVector: undefined,
      rotationY: 0,
      rotationZ: 0,
      editingId: null,
    }));
  };

  const handleDelete = (move: Move) => {
    setLibrary((prev) => prev.filter((m) => m.id !== move.id));
    if (draft.editingId === move.id) resetDraft();
  };

  // Preview the in-progress draft as a transient (unsaved) Move.
  const handlePlayDraft = () => {
    sequencer.runChain([
      {
        id: "__draft__",
        primary: draft.primary.trim() || "draft",
        speed: draft.speed,
        targetPose: draft.targetPose,
        forceVector: draft.forceVector,
        rotationY: draft.rotationY || undefined,
        rotationZ: draft.rotationZ || undefined,
      },
    ]);
  };

  const handlePlayMove = (move: Move) => {
    sequencer.runChain([move]);
  };

  return (
    <div className="dance-lab">
      <header className="dance-lab__header">
        <button
          type="button"
          className="dance-lab__back"
          onClick={onBack}
        >
          ← Back to playground
        </button>
        <div
          className="dance-lab__disco"
          aria-hidden="true"
          title="Disco ball"
        />
      </header>

      <MoveLibrary
        moves={library}
        editingId={draft.editingId}
        onPlay={handlePlayMove}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNew={resetDraft}
      />

      <main className="dance-lab__main">
        <div className="dance-lab__stage">
          <div className="dance-lab__pedestal" aria-hidden="true" />
          <div
            className="dance-lab__character-wrap"
            style={{ transform }}
          >
            <Character
              animal={avatar.animal}
              rig={rig}
              pose={displayPose}
              palette={palette}
              width={CHARACTER_DISPLAY_WIDTH}
            />
            {!sequencer.isPlaying && (
              <>
                <PoseHandles
                  animal={avatar.animal}
                  rig={rig}
                  pose={draft.targetPose}
                  onPoseChange={(targetPose) =>
                    setDraft({ ...draft, targetPose })
                  }
                  width={CHARACTER_DISPLAY_WIDTH}
                />
                <ForceHandle
                  animal={avatar.animal}
                  rig={rig}
                  forceVector={draft.forceVector}
                  onForceVectorChange={(forceVector) =>
                    setDraft({ ...draft, forceVector })
                  }
                  width={CHARACTER_DISPLAY_WIDTH}
                />
              </>
            )}
          </div>
        </div>

        <MoveForm
          primary={draft.primary}
          secondary={draft.secondary}
          speed={draft.speed}
          rotationY={draft.rotationY}
          rotationZ={draft.rotationZ}
          editing={draft.editingId !== null}
          canSave={canSave}
          nameErrors={nameErrors}
          onPrimaryChange={(primary) => {
            setDraft({ ...draft, primary });
            setNameErrors((e) => ({ ...e, primary: false }));
          }}
          onSecondaryChange={(secondary) => {
            setDraft({ ...draft, secondary });
            setNameErrors((e) => ({ ...e, secondary: false }));
          }}
          onSpeedChange={(speed) => setDraft({ ...draft, speed })}
          onRotationYChange={(rotationY) =>
            setDraft({ ...draft, rotationY })
          }
          onRotationZChange={(rotationZ) =>
            setDraft({ ...draft, rotationZ })
          }
          onSave={handleSave}
          onSaveAsNew={handleSaveAsNew}
          onPlay={handlePlayDraft}
          onResetPose={handleResetPose}
        />
      </main>
    </div>
  );
}
