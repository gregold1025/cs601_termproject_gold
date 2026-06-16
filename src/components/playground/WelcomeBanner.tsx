// WelcomeBanner — load-time greeting that fades in, holds, and fades
// out shortly after the playground mounts. The text reads
// "Welcome [Adjective] [Animal] of the [Biome]" using the formatter
// in data/avatar.ts, so the greeting personalizes to whatever avatar
// the user committed (either INITIAL_AVATAR on a first visit or a
// returning visitor's saved choice).
//
// Distinct from the customize-mode AvatarBanner ("You are the …")
// which is a UI-state cue, not a greeting. This component is purely
// decorative; pointer-events are off and the animation drives its
// own lifecycle in CSS — no React timers, no unmount choreography.

import React, { useState } from "react";
import { Avatar, welcomeText } from "../../data/avatar";
import "./WelcomeBanner.css";

// Module-scoped flag — preserved across React mount/unmount cycles
// (so the banner doesn't fire again when the user returns to the
// playground from a lab) but reset when the JS bundle reloads (so a
// page refresh shows it again). The first WelcomeBanner mount flips
// it to true; subsequent mounts within the same page lifetime check
// the flag and render nothing.
let hasShownWelcome = false;

export type WelcomeBannerProps = {
  avatar: Avatar;
};

export function WelcomeBanner({ avatar }: WelcomeBannerProps) {
  // Lazy initial state captures the decision at mount and never changes,
  // so even if the parent re-renders mid-animation the banner finishes
  // its keyframes.
  const [shouldShow] = useState(() => {
    if (hasShownWelcome) return false;
    hasShownWelcome = true;
    return true;
  });

  if (!shouldShow) return null;

  return (
    <div
      className="welcome-banner"
      role="status"
      aria-live="polite"
    >
      {welcomeText(avatar)}
    </div>
  );
}
