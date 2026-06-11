// PlaygroundView — the main avatar playground.
//
// The character is ONE physics body with two control inputs:
//   1. Direct (arrow keys / WASD) — movement intent + jump, straight
//      into useCharacterPhysics.
//   2. Symbolic (typed commands) — resolveCommandChain parses the input
//      into a Move[]; useMoveSequencer conducts it, cueing physics
//      impulses and articulation (pose/rotation) per link.
//
// Placement comes from physics alone. Articulation only shapes and
// rotates the body — it never moves it; forces are real impulses that
// persist (the character lands wherever physics says).
//
// The command surface: a frosted input fixed bottom-center (space or
// enter executes; the runner resolves against the library and flashes
// green/red) plus a floating history stack bottom-left. Both hide
// during customize mode. While the input is focused, movement keys are
// disabled so arrows edit text instead of walking the character.

import React, { useEffect, useState } from "react";
import { Character } from "./Character";
import { Playground } from "./Playground";
import { CustomizeAvatar } from "./customize-avatar";
import { CommandInput } from "./CommandInput";
import { CommandHistory } from "./CommandHistory";
import { useCharacterPhysics } from "../engine/useCharacterPhysics";
import { useCharacterArticulation } from "../engine/useCharacterArticulation";
import { useMoveSequencer } from "../engine/useMoveSequencer";
import { useKeyboardInput } from "../engine/useKeyboardInput";
import { useCommandRunner } from "../engine/useCommandRunner";
import { useLocalStorage } from "../engine/useLocalStorage";
import { Avatar } from "../data/avatar";
import { CHARACTER_RIGS } from "../data/characters";
import { NEUTRAL_POSE } from "../data/characters/types";
import { ADJECTIVE_PALETTES } from "../data/characters/palette";
import { Move, MOVE_LIBRARY_KEY } from "../data/characters/dance";

// All biomes share a 3500px world width; half = how far the character
// can roam to either side of world center.
const WORLD_HALF_WIDTH = 1750;

export type PlaygroundViewProps = {
  committedAvatar: Avatar;
  setCommittedAvatar: React.Dispatch<React.SetStateAction<Avatar>>;
};

export function PlaygroundView({
  committedAvatar,
  setCommittedAvatar,
}: PlaygroundViewProps) {
  const [draftAvatar, setDraftAvatar] = useState<Avatar | null>(null);

  // The two engines + the conductor.
  const physics = useCharacterPhysics({
    bounds: { minX: -WORLD_HALF_WIDTH, maxX: WORLD_HALF_WIDTH },
  });
  const articulation = useCharacterArticulation({ basePose: NEUTRAL_POSE });
  const sequencer = useMoveSequencer({
    articulation,
    applyImpulse: physics.applyImpulse,
    getAltitude: () => physics.position.y,
  });

  const customizing = draftAvatar !== null;

  // Move library — written by the dance lab, read here. Views never
  // mount simultaneously, so the mount-time read is always fresh.
  const [library] = useLocalStorage<Move[]>(MOVE_LIBRARY_KEY, []);

  const playMoves = (moves: Move[]) => sequencer.runChain(moves);

  const runner = useCommandRunner(library, playMoves);

  useKeyboardInput({
    onLeftDown: () => physics.setMovingLeft(true),
    onLeftUp: () => physics.setMovingLeft(false),
    onRightDown: () => physics.setMovingRight(true),
    onRightUp: () => physics.setMovingRight(false),
    onJump: () => physics.jump(),
    disabled: customizing || runner.inputFocused,
  });

  // Entering customize cancels any in-flight movement intent — otherwise
  // a held key would keep the character drifting while you edit. Also
  // clears the input-focused flag, because the CommandInput unmounts
  // without firing blur when customize mode opens.
  const { setInputFocused } = runner;
  useEffect(() => {
    if (customizing) {
      physics.setMovingLeft(false);
      physics.setMovingRight(false);
      setInputFocused(false);
    }
  }, [customizing, physics, setInputFocused]);

  const currentAvatar = draftAvatar ?? committedAvatar;
  const rig = CHARACTER_RIGS[currentAvatar.animal];
  const palette = ADJECTIVE_PALETTES[currentAvatar.adjective];

  const rotation = articulation.currentRotation;
  const rotationTransform = `rotateY(${rotation.y * 360}deg) rotateZ(${rotation.z * 360}deg)`;

  return (
    <>
      <Playground
        biome={currentAvatar.biome}
        characterX={physics.position.x}
        characterY={physics.position.y}
        character={
          // Outer div supplies perspective so rotateY reads as a real
          // 3D flip (foreshortening) instead of a flat horizontal squish.
          // Perspective must live on the PARENT of the transformed element.
          <div style={{ perspective: 800 }}>
            <div style={{ transform: rotationTransform }}>
              <Character
                animal={currentAvatar.animal}
                rig={rig}
                pose={articulation.currentPose ?? NEUTRAL_POSE}
                palette={palette}
              />
            </div>
          </div>
        }
      >
        <CustomizeAvatar
          committedAvatar={committedAvatar}
          setCommittedAvatar={setCommittedAvatar}
          draftAvatar={draftAvatar}
          setDraftAvatar={setDraftAvatar}
        />
      </Playground>

      {!customizing && (
        <>
          <CommandHistory entries={runner.history} />
          <CommandInput
            value={runner.input}
            flash={runner.flash}
            onChange={runner.setInput}
            onSubmit={runner.submit}
            onFocusChange={runner.setInputFocused}
          />
        </>
      )}
    </>
  );
}
