// useGameLoop — minimal requestAnimationFrame loop hook.
// Calls onTick(dt) every frame with the elapsed time in seconds.
// dt is clamped to 50ms so background-tab returns don't teleport entities.

import { useEffect, useRef } from "react";

export function useGameLoop(onTick: (dt: number) => void): void {
  // Keep the latest callback in a ref so the effect doesn't re-subscribe
  // when the callback identity changes between renders.
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tickRef.current(dt);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);
}
