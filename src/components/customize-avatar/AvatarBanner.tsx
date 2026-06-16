// AvatarBanner — appears in the playground sky during customize mode.
// "You are the [adjective] [animal] of the [biome]" — the adjective is
// colored to match its palette.dark; the rest of the text is black.
//
// Distinct from the load-time WelcomeBanner (components/playground/),
// which greets the user on first paint with "Welcome [Adjective]
// [Animal] of the [Biome]" and animates out after a few seconds.
// AvatarBanner is a UI-state cue (you're in customize mode); the
// WelcomeBanner is a load-time greeting.

import React from "react";
import { Avatar } from "../../data/avatar";
import { ADJECTIVE_PALETTES } from "../../data/characters/palette";
import "./customize-ui.css";

export type AvatarBannerProps = {
  avatar: Avatar;
};

export function AvatarBanner({ avatar }: AvatarBannerProps) {
  const palette = ADJECTIVE_PALETTES[avatar.adjective];
  return (
    <div className="cui-avatar-banner">
      You are the{" "}
      <span style={{ color: palette.dark }}>{avatar.adjective}</span>{" "}
      {avatar.animal} <br /> of the {avatar.biome}
    </div>
  );
}
