import React, { useState } from "react";
import "./App.css";
import { PlaygroundView } from "./components/playground/PlaygroundView";
import { DanceLab } from "./components/labs/dance-lab";
import { ShapeLab } from "./components/labs/shape-lab";
import { LabSelection } from "./components/LabSelection";
import { HamburgerMenu } from "./components/HamburgerMenu";
import { useLocalStorage } from "./engine/useLocalStorage";
import { Avatar, AVATAR_KEY } from "./data/avatar";

// Placeholder until onboarding flow exists.
const INITIAL_AVATAR: Avatar = {
  animal: "pig",
  adjective: "friendly",
  biome: "mountains",
};

type View = "playground" | "danceLab" | "shapeLab";

function App() {
  // Avatar persists across reloads. First-time visitor gets INITIAL_AVATAR;
  // returning visitor gets whatever they last committed via the customize
  // panel.
  const [committedAvatar, setCommittedAvatar] = useLocalStorage<Avatar>(
    AVATAR_KEY,
    INITIAL_AVATAR,
  );
  const [currentView, setCurrentView] = useState<View>("playground");

  return (
    <div
      className={`App${currentView === "playground" ? " App--playground" : ""}`}
    >
      {currentView === "playground" && (
        <>
          <HamburgerMenu />
          <PlaygroundView
            committedAvatar={committedAvatar}
            setCommittedAvatar={setCommittedAvatar}
          />
          <LabSelection
            onOpenDanceLab={() => setCurrentView("danceLab")}
            onOpenShapeLab={() => setCurrentView("shapeLab")}
          />
        </>
      )}
      {currentView === "danceLab" && (
        <DanceLab
          avatar={committedAvatar}
          onBack={() => setCurrentView("playground")}
        />
      )}
      {currentView === "shapeLab" && (
        <ShapeLab onBack={() => setCurrentView("playground")} />
      )}
    </div>
  );
}

export default App;
