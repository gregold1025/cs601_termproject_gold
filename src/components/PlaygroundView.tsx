// PlaygroundView — the main avatar playground.
// Owns playground-only state (draft avatar, character physics, keyboard
// input). App provides the committed avatar; everything else is local.

import React, { useEffect, useState } from "react";
import { Character } from "./Character";
import { Playground } from "./Playground";
import { CustomizeAvatar } from "./customize-avatar";
import { useCharacterPhysics } from "../engine/useCharacterPhysics";
import { useKeyboardInput } from "../engine/useKeyboardInput";
import { Avatar } from "../data/avatar";
import { CHARACTER_RIGS } from "../data/characters";
import { NEUTRAL_POSE } from "../data/characters/types";
import { ADJECTIVE_PALETTES } from "../data/characters/palette";

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

  useKeyboardInput({
    onLeftDown: () => physics.setMovingLeft(true),
    onLeftUp: () => physics.setMovingLeft(false),
    onRightDown: () => physics.setMovingRight(true),
    onRightUp: () => physics.setMovingRight(false),
    onJump: () => physics.jump(),
    disabled: customizing,
  });

  // Entering customize cancels any in-flight movement intent — otherwise
  // a held key would keep the character drifting while you edit.
  useEffect(() => {
    if (customizing) {
      physics.setMovingLeft(false);
      physics.setMovingRight(false);
    }
  }, [customizing, physics]);

  const currentAvatar = draftAvatar ?? committedAvatar;
  const rig = CHARACTER_RIGS[currentAvatar.animal];
  const palette = ADJECTIVE_PALETTES[currentAvatar.adjective];

  return (
    <Playground
      biome={currentAvatar.biome}
      characterX={physics.position.x}
      characterY={physics.position.y}
      character={
        <Character
          animal={currentAvatar.animal}
          rig={rig}
          pose={NEUTRAL_POSE}
          palette={palette}
        />
      }
    >
      <CustomizeAvatar
        committedAvatar={committedAvatar}
        setCommittedAvatar={setCommittedAvatar}
        draftAvatar={draftAvatar}
        setDraftAvatar={setDraftAvatar}
      />
    </Playground>
  );
}
