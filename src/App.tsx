import React, { useState } from "react";
import "./App.css";
import { AnchorMeasure } from "./dev/AnchorMeasure";
import { PlaygroundView } from "./components/PlaygroundView";
import { DanceEditorView } from "./components/dance-editor";
import { BottomBar } from "./components/BottomBar";
import { Avatar } from "./data/avatar";

const isMeasureMode =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("measure");

// Placeholder until onboarding flow exists.
const INITIAL_AVATAR: Avatar = {
  animal: "pig",
  adjective: "friendly",
  biome: "mountains",
};

// Sketch of a companion avatar for later (not rendered yet).
const FRIEND_AVATAR: Avatar = {
  animal: "lion",
  adjective: "strong",
  biome: "jungle",
};

type View = "playground" | "danceEditor";

function App() {
  const [committedAvatar, setCommittedAvatar] =
    useState<Avatar>(INITIAL_AVATAR);
  const [currentView, setCurrentView] = useState<View>("playground");

  if (isMeasureMode) {
    return <AnchorMeasure />;
  }

  return (
    <div className="App">
      {currentView === "playground" && (
        <>
          <PlaygroundView
            committedAvatar={committedAvatar}
            setCommittedAvatar={setCommittedAvatar}
          />
          <BottomBar onOpenDanceEditor={() => setCurrentView("danceEditor")} />
        </>
      )}
      {currentView === "danceEditor" && (
        <DanceEditorView
          avatar={committedAvatar}
          onBack={() => setCurrentView("playground")}
        />
      )}
    </div>
  );
}

export default App;
