// CustomizeUI — orchestrates everything customize-related.
// Consumes the committed + draft avatar slots from App and owns the
// four state-transition handlers (start, save, cancel, updateDraft).
// Renders the customize-mode controls only when a draft exists, and the
// Customize / Save+Cancel button pair always.
//
// App.tsx renders this as a single child of <Playground />.

import React from "react";
import { Avatar } from "../../data/avatar";
import { CustomizeButton } from "./CustomizeButton";
import { SaveCancelButtons } from "./SaveCancelButtons";
import { ColorPicker } from "./ColorPicker";
import { AnimalArrows } from "./AnimalArrows";
import { BiomeArrows } from "./BiomeArrows";
import { AvatarBanner } from "./AvatarBanner";

export type CustomizeAvatarProps = {
  committedAvatar: Avatar;
  setCommittedAvatar: React.Dispatch<React.SetStateAction<Avatar>>;
  draftAvatar: Avatar | null;
  setDraftAvatar: React.Dispatch<React.SetStateAction<Avatar | null>>;
};

export function CustomizeAvatar({
  committedAvatar,
  setCommittedAvatar,
  draftAvatar,
  setDraftAvatar,
}: CustomizeAvatarProps) {
  const customizing = draftAvatar !== null;
  const currentAvatar = draftAvatar ?? committedAvatar;

  const startCustomize = () => setDraftAvatar({ ...committedAvatar });
  const saveCustomize = () => {
    if (draftAvatar) setCommittedAvatar(draftAvatar);
    setDraftAvatar(null);
  };
  const cancelCustomize = () => setDraftAvatar(null);
  const updateDraft = (patch: Partial<Avatar>) =>
    setDraftAvatar((prev) => (prev ? { ...prev, ...patch } : null));

  return (
    <>
      {customizing && (
        <>
          <AvatarBanner avatar={currentAvatar} />
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
        <SaveCancelButtons onSave={saveCustomize} onCancel={cancelCustomize} />
      ) : (
        <CustomizeButton onClick={startCustomize} />
      )}
    </>
  );
}
