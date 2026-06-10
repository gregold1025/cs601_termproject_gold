// DanceEditorView — artifact editor. One Move per saved command,
// edited via on-character handles (pose limbs + force vector) plus a
// flat form (primary, secondary, speed, rotation Y, rotation Z).

import React, { useState } from "react";
import { Avatar } from "../../data/avatar";
import { CHARACTER_RIGS } from "../../data/characters";
import { ADJECTIVE_PALETTES } from "../../data/characters/palette";
import { NEUTRAL_POSE, CharacterPose } from "../../data/characters/types";
import { Move, newMoveId, SPEED_DEFAULT } from "../../data/characters/dance";
import { Character, characterDisplayBox } from "../Character";
import { MoveLibrary } from "./MoveLibrary";
import { MoveForm } from "./MoveForm";
import { PoseHandles } from "./PoseHandles";
import { TransformHandles } from "./TransformHandles";
import { useMovePlayer } from "../../engine/useMovePlayer";
import { useLocalStorage } from "../../engine/useLocalStorage";
import "./dance-editor.css";

const CHARACTER_DISPLAY_WIDTH = 380;
const LIBRARY_KEY = "ugp.move-library.v1";

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

export type DanceEditorViewProps = {
  avatar: Avatar;
  onBack: () => void;
};

export function DanceEditorView({ avatar, onBack }: DanceEditorViewProps) {
  const [library, setLibrary] = useLocalStorage<Move[]>(LIBRARY_KEY, []);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const player = useMovePlayer({ basePose: NEUTRAL_POSE });

  const rig = CHARACTER_RIGS[avatar.animal];
  const palette = ADJECTIVE_PALETTES[avatar.adjective];

  // SVG units → CSS pixels for the preview translate.
  const box = characterDisplayBox(avatar.animal, CHARACTER_DISPLAY_WIDTH);
  const cssScale = box.display.width / box.viewBox.width;
  const cssOffset = {
    x: player.currentOffset.x * cssScale,
    y: player.currentOffset.y * cssScale,
  };
  const rotation = player.currentRotation;
  const transform = `translate(${cssOffset.x}px, ${cssOffset.y}px) rotateY(${rotation.y * 360}deg) rotateZ(${rotation.z * 360}deg)`;

  const displayPose = player.currentPose ?? draft.targetPose;

  const canSave = draft.primary.trim().length > 0;

  const resetDraft = () => setDraft(EMPTY_DRAFT);

  const handleSave = () => {
    if (!canSave) return;
    const payload: Omit<Move, "id"> = {
      primary: draft.primary.trim(),
      secondary: draft.secondary.trim() || undefined,
      speed: draft.speed,
      targetPose: draft.targetPose,
      forceVector: draft.forceVector,
      rotationY: draft.rotationY || undefined,
      rotationZ: draft.rotationZ || undefined,
    };
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

  const handleEdit = (move: Move) => {
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

  const handleDelete = (move: Move) => {
    setLibrary((prev) => prev.filter((m) => m.id !== move.id));
    if (draft.editingId === move.id) resetDraft();
  };

  const handlePlayDraft = () => {
    player.play({
      targetPose: draft.targetPose,
      forceVector: draft.forceVector,
      rotationY: draft.rotationY,
      rotationZ: draft.rotationZ,
      speed: draft.speed,
    });
  };

  const handlePlayMove = (move: Move) => {
    player.play({
      targetPose: move.targetPose,
      forceVector: move.forceVector,
      rotationY: move.rotationY ?? 0,
      rotationZ: move.rotationZ ?? 0,
      speed: move.speed,
    });
  };

  return (
    <div className="dance-editor">
      <header className="dance-editor__header">
        <button
          type="button"
          className="dance-editor__back"
          onClick={onBack}
        >
          ← Back to playground
        </button>
        <div
          className="dance-editor__disco"
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
      />

      <main className="dance-editor__main">
        <div className="dance-editor__stage">
          <div className="dance-editor__pedestal" aria-hidden="true" />
          <div
            className="dance-editor__character-wrap"
            style={{ transform }}
          >
            <Character
              animal={avatar.animal}
              rig={rig}
              pose={displayPose}
              palette={palette}
              width={CHARACTER_DISPLAY_WIDTH}
            />
            {!player.isPlaying && (
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
                <TransformHandles
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
          onPrimaryChange={(primary) => setDraft({ ...draft, primary })}
          onSecondaryChange={(secondary) => setDraft({ ...draft, secondary })}
          onSpeedChange={(speed) => setDraft({ ...draft, speed })}
          onRotationYChange={(rotationY) =>
            setDraft({ ...draft, rotationY })
          }
          onRotationZChange={(rotationZ) =>
            setDraft({ ...draft, rotationZ })
          }
          onSave={handleSave}
          onPlay={handlePlayDraft}
          onResetOrientation={player.resetOrientation}
          onCancelEdit={resetDraft}
        />
      </main>
    </div>
  );
}
