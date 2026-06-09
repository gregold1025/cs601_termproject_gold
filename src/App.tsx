import React, { useState } from "react";
import "./App.css";
import { AnchorMeasure } from "./dev/AnchorMeasure";
import { Character } from "./components/Character";
import { Playground } from "./components/Playground";
import { CustomizeButton } from "./components/customize-ui/CustomizeButton";
import { SaveCancelButtons } from "./components/customize-ui/SaveCancelButtons";
import { ColorPicker } from "./components/customize-ui/ColorPicker";
import { AnimalArrows } from "./components/customize-ui/AnimalArrows";
import { BiomeArrows } from "./components/customize-ui/BiomeArrows";
import { WelcomeBanner } from "./components/customize-ui/WelcomeBanner";
import { Avatar } from "./data/avatar";
import { RIGS } from "./data/rigs";
import { NEUTRAL_POSE } from "./data/character";
import { ADJECTIVE_PALETTES } from "./data/palette";

const isMeasureMode =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("measure");

// Placeholder until onboarding flow exists.
const INITIAL_AVATAR: Avatar = {
  animal: "pig",
  adjective: "friendly",
  biome: "mountains",
};

function App() {
  // Two pieces of state. While editing, draftAvatar holds tentative changes;
  // currentAvatar (derived) is what the playground/character render against.
  const [committedAvatar, setCommittedAvatar] = useState<Avatar>(INITIAL_AVATAR);
  const [draftAvatar, setDraftAvatar] = useState<Avatar | null>(null);

  if (isMeasureMode) {
    return <AnchorMeasure />;
  }

  const customizing = draftAvatar !== null;
  const currentAvatar = draftAvatar ?? committedAvatar;
  const rig = RIGS[currentAvatar.animal];
  const palette = ADJECTIVE_PALETTES[currentAvatar.adjective];

  const startCustomize = () => setDraftAvatar({ ...committedAvatar });
  const saveCustomize = () => {
    if (draftAvatar) setCommittedAvatar(draftAvatar);
    setDraftAvatar(null);
  };
  const cancelCustomize = () => setDraftAvatar(null);
  const updateDraft = (patch: Partial<Avatar>) =>
    setDraftAvatar((prev) => (prev ? { ...prev, ...patch } : null));

  return (
    <div className="App">
      <Playground
        biome={currentAvatar.biome}
        character={
          <Character
            animal={currentAvatar.animal}
            rig={rig}
            pose={NEUTRAL_POSE}
            palette={palette}
          />
        }
      >
        {customizing && (
          <>
            <WelcomeBanner avatar={currentAvatar} />
            <ColorPicker
              selected={currentAvatar.adjective}
              onSelect={(adjective) => updateDraft({ adjective })}
            />
            <AnimalArrows
              selected={currentAvatar.animal}
              onSelect={(animal) => updateDraft({ animal })}
            />
            <BiomeArrows
              selected={currentAvatar.biome}
              onSelect={(biome) => updateDraft({ biome })}
            />
          </>
        )}
        {customizing ? (
          <SaveCancelButtons
            onSave={saveCustomize}
            onCancel={cancelCustomize}
          />
        ) : (
          <CustomizeButton onClick={startCustomize} />
        )}
      </Playground>
    </div>
  );
}

export default App;
