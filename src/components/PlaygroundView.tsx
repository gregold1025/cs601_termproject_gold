// PlaygroundView — the main avatar playground.
//
// The character has two parallel control inputs that compose:
//   1. Physics (arrow keys / WASD) — drives world position via
//      useCharacterPhysics. Direct, real-time, low-level.
//   2. Commands (typed words) — drives pose / dance offset / rotation
//      via useMovePlayer against the saved move library. Symbolic,
//      named, high-level.
// Physics owns world position; the move player owns pose, launch
// offset, and rotation. The character's final placement is the sum.
//
// The command surface: a frosted input fixed bottom-center (space or
// enter executes; the runner resolves against the library and flashes
// green/red) plus a floating history stack bottom-left. Both hide
// during customize mode. While the input is focused, movement keys are
// disabled so arrows edit text instead of walking the character.

import React, { useEffect, useState } from "react";
import { Character, characterDisplayBox } from "./Character";
import { Playground } from "./Playground";
import { CustomizeAvatar } from "./customize-avatar";
import { CommandInput } from "./CommandInput";
import { CommandHistory } from "./CommandHistory";
import { useCharacterPhysics } from "../engine/useCharacterPhysics";
import { useKeyboardInput } from "../engine/useKeyboardInput";
import { useMovePlayer } from "../engine/useMovePlayer";
import { useCommandRunner } from "../engine/useCommandRunner";
import { useLocalStorage } from "../engine/useLocalStorage";
import { Avatar } from "../data/avatar";
import { CHARACTER_RIGS } from "../data/characters";
import { NEUTRAL_POSE } from "../data/characters/types";
import { ADJECTIVE_PALETTES } from "../data/characters/palette";
import {
  Move,
  MOVE_LIBRARY_KEY,
  FORCE_STRENGTH_MULTIPLIER,
} from "../data/characters/dance";

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

  const physics = useCharacterPhysics({
    bounds: { minX: -WORLD_HALF_WIDTH, maxX: WORLD_HALF_WIDTH },
  });
  const customizing = draftAvatar !== null;

  // Move library — written by the dance lab, read here. Views never
  // mount simultaneously, so the mount-time read is always fresh.
  const [library] = useLocalStorage<Move[]>(MOVE_LIBRARY_KEY, []);

  // Move player — same engine the dance lab previews with.
  const player = useMovePlayer({ basePose: NEUTRAL_POSE });

  // Split execution across the two engines:
  //   - forceVector → a real physics impulse. It persists: the character
  //     flies through the world, gravity and ground do their thing, and
  //     they LAND wherever physics says — no return-to-start. The lab's
  //     preview return-home is preview-only.
  //   - pose + rotation + speed → the move player (visual articulation).
  //     forceVector is deliberately NOT passed to the player here, or it
  //     would double-apply as a cosmetic launch offset on top of the
  //     physics one.
  // Dot-chains ("mw.wm") arrive as an ordered Move[]; each link becomes
  // a sequence item whose onStart fires that move's impulse at the
  // moment the link begins — not all-at-once on submit.
  // Units note: the saved vector is in the character's SVG viewBox units;
  // we treat them 1:1 as world px/s, which lands a max-radius drag near
  // jump strength. Tune FORCE_STRENGTH_MULTIPLIER to taste.
  const playMoves = (moves: Move[]) => {
    player.playSequence(
      moves.map((move) => ({
        args: {
          targetPose: move.targetPose,
          rotationY: move.rotationY ?? 0,
          rotationZ: move.rotationZ ?? 0,
          speed: move.speed,
        },
        onStart: () => {
          if (move.forceVector) {
            physics.applyImpulse(
              move.forceVector.x * FORCE_STRENGTH_MULTIPLIER,
              move.forceVector.y * FORCE_STRENGTH_MULTIPLIER,
            );
          }
        },
      })),
    );
  };

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

  // Move-player offset is in the character's SVG viewBox units; the
  // playground positions in CSS pixels. Convert via the character's
  // default display scale, then sum with the physics position.
  const box = characterDisplayBox(currentAvatar.animal);
  const cssScale = box.display.width / box.viewBox.width;
  const characterX = physics.position.x + player.currentOffset.x * cssScale;
  const characterY = physics.position.y + player.currentOffset.y * cssScale;

  const rotation = player.currentRotation;
  const rotationTransform = `rotateY(${rotation.y * 360}deg) rotateZ(${rotation.z * 360}deg)`;

  return (
    <>
      <Playground
        biome={currentAvatar.biome}
        characterX={characterX}
        characterY={characterY}
        character={
          // Outer div supplies perspective so rotateY reads as a real
          // 3D flip (foreshortening) instead of a flat horizontal squish.
          // Perspective must live on the PARENT of the transformed element.
          <div style={{ perspective: 800 }}>
            <div style={{ transform: rotationTransform }}>
              <Character
                animal={currentAvatar.animal}
                rig={rig}
                pose={player.currentPose ?? NEUTRAL_POSE}
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
