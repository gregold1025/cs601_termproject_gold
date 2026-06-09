import React, { useEffect, useState } from "react";
import "./App.css";
import { AnchorMeasure } from "./dev/AnchorMeasure";
import { Character } from "./components/Character";
import { Playground } from "./components/Playground";
import { CustomizeAvatar } from "./components/customize-avatar";
import { useCharacterPhysics } from "./engine/useCharacterPhysics";
import { useKeyboardInput } from "./engine/useKeyboardInput";
import { Avatar } from "./data/avatar";
import { CHARACTER_RIGS } from "./data/characters";
import { NEUTRAL_POSE } from "./data/characters/types";
import { ADJECTIVE_PALETTES } from "./data/characters/palette";

const isMeasureMode =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("measure");

// Placeholder until onboarding flow exists.
const INITIAL_AVATAR: Avatar = {
  animal: "pig",
  adjective: "friendly",
  biome: "mountains",
};

const FRIEND_AVATAR: Avatar = {
  animal: "lion",
  adjective: "strong",
  biome: "jungle",
};
// All biomes share a 3500px world width; half = how far the character
// can roam to either side of world center.
const WORLD_HALF_WIDTH = 1750;

function App() {
  // Avatar slots: committed = source of truth, draft = tentative edits.
  // currentAvatar (derived) is what the playground/character render against.
  const [committedAvatar, setCommittedAvatar] =
    useState<Avatar>(INITIAL_AVATAR);
  const [draftAvatar, setDraftAvatar] = useState<Avatar | null>(null);

  // Physics + keyboard hooks. Hooks must be called before any early return.
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

  if (isMeasureMode) {
    return <AnchorMeasure />;
  }

  const currentAvatar = draftAvatar ?? committedAvatar;
  const rig = CHARACTER_RIGS[currentAvatar.animal];
  const palette = ADJECTIVE_PALETTES[currentAvatar.adjective];

  return (
    <div className="App">
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
    </div>
  );
}

export default App;
