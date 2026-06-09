// Welcome banner — appears in the playground sky during customize mode.
// "You are the [adjective] [animal] of the [biome]" — the adjective is
// colored to match its palette.dark; the rest of the text is black.

import React from "react";
import { Avatar } from "../../data/avatar";
import { ADJECTIVE_PALETTES } from "../../data/palette";
import "./customize-ui.css";

export type WelcomeBannerProps = {
  avatar: Avatar;
};

export function WelcomeBanner({ avatar }: WelcomeBannerProps) {
  const palette = ADJECTIVE_PALETTES[avatar.adjective];
  return (
    <div className="cui-welcome-banner">
      You are the{" "}
      <span style={{ color: palette.dark }}>{avatar.adjective}</span>{" "}
      {avatar.animal} <br /> of the {avatar.biome}
    </div>
  );
}
