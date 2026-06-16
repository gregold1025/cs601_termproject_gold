// PlaygroundView — the main avatar playground.
//
// The character has one control input: typed commands. resolveCommandChain
// parses the input into a CommandToken[]; useMoveSequencer conducts it,
// cueing physics impulses and articulation (pose/rotation) per move, and
// firing shape spawns as decorative stickers.
//
// Placement comes from physics alone. Articulation only shapes and
// rotates the body — it never moves it; forces are real impulses that
// persist (the character lands wherever physics says).
//
// The command surface: a frosted input fixed bottom-center (space or
// enter executes; the runner resolves against the library and flashes
// green/red) plus a floating history stack bottom-left. Both hide
// during customize mode.

import React, { useEffect, useState } from "react";
import { Character } from "../Character";
import { Playground } from "./Playground";
import { CustomizeAvatar } from "../customize-avatar";
import { CommandInput } from "./CommandInput";
import { CommandHistory } from "./CommandHistory";
import { WelcomeBanner } from "./WelcomeBanner";
import { useCharacterPhysics } from "../../engine/useCharacterPhysics";
import { useCharacterArticulation } from "../../engine/useCharacterArticulation";
import { useMoveSequencer } from "../../engine/useMoveSequencer";
import { useCommand } from "../../engine/useCommand";
import { useLocalStorage } from "../../engine/useLocalStorage";
import { Avatar } from "../../data/avatar";
import { CHARACTER_RIGS } from "../../data/characters";
import { NEUTRAL_POSE } from "../../data/characters/types";
import { ADJECTIVE_PALETTES } from "../../data/characters/palette";
import { Move, MOVE_LIBRARY_KEY } from "../../data/labs/dance-moves/dance";
import { Shape, SHAPE_LIBRARY_KEY } from "../../data/labs/shapes/grammar";
import {
  Sticker,
  newStickerId,
  STICKER_LIBRARY_KEY,
  STICKER_SPAWN_OFFSET_X,
  STICKER_SPAWN_OFFSET_Y,
} from "../../data/labs/shapes/stickers";

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

  const customizing = draftAvatar !== null;

  // Move and shape libraries — written by their labs, read here. Views
  // never mount simultaneously, so the mount-time read is always fresh.
  const [moveLibrary] = useLocalStorage<Move[]>(MOVE_LIBRARY_KEY, []);
  const [shapeLibrary] = useLocalStorage<Shape[]>(SHAPE_LIBRARY_KEY, []);

  // Stickers — placed shapes in the world. Persisted in localStorage so
  // entering and leaving a lab (which unmounts the playground) doesn't
  // wipe placements. Each carries its world coordinate (snapshotted from
  // physics.position at spawn time) and a frozen Shape snapshot, so
  // later edits to the underlying Shape leave already-placed stickers
  // untouched.
  const [stickers, setStickers] = useLocalStorage<Sticker[]>(
    STICKER_LIBRARY_KEY,
    [],
  );

  const spawnSticker = (shape: Shape) => {
    setStickers((prev) => [
      ...prev,
      {
        id: newStickerId(),
        // Spread to freeze the snapshot — without it we'd hold a live
        // reference and lose peel-and-stick semantics.
        shape: { ...shape },
        worldX: physics.position.x + STICKER_SPAWN_OFFSET_X,
        worldY: physics.position.y + STICKER_SPAWN_OFFSET_Y,
      },
    ]);
  };

  const sequencer = useMoveSequencer({
    articulation,
    applyImpulse: physics.applyImpulse,
    getAltitude: () => physics.position.y,
    onSpawnSticker: spawnSticker,
  });

  const runner = useCommand(moveLibrary, shapeLibrary, sequencer.runChain);

  // Entering customize clears the input-focused flag. CommandInput
  // unmounts during customize without firing blur, so the flag would
  // otherwise stay true after exit.
  const { setInputFocused } = runner;
  useEffect(() => {
    if (customizing) {
      setInputFocused(false);
    }
  }, [customizing, setInputFocused]);

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
        stickers={stickers}
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
        <WelcomeBanner avatar={committedAvatar} />
        <CustomizeAvatar
          committedAvatar={committedAvatar}
          setCommittedAvatar={setCommittedAvatar}
          draftAvatar={draftAvatar}
          setDraftAvatar={setDraftAvatar}
        />
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
      </Playground>
    </>
  );
}
