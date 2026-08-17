"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Drives a looping step sequence. `durations[i]` is how long step `i` is held
 * before advancing. When `enabled` is false (reduced motion) the hook returns
 * `staticStep` and never advances, so the UI shows one resolved frame.
 * Pass a module-level `durations` array so its identity stays stable.
 *
 * `startStep` moves where the *first* cycle begins; the loop still wraps
 * through the whole sequence after that. Several of these sequences open on an
 * empty out-frame, which is a loop transition rather than an entrance — right
 * when the tile has been running since page load, wrong for a copy that mounts
 * the instant you click, where it reads as the click not registering.
 */
export function useLoopStep(
  durations: number[],
  enabled: boolean,
  staticStep = 0,
  startStep = 0,
): number {
  const [step, setStep] = useState(startStep);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let i = startStep;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      if (!active) return;
      setStep(i);
      const hold = durations[i];
      i = (i + 1) % durations.length;
      timer = setTimeout(run, hold);
    };
    run();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [durations, enabled, startStep]);

  return enabled ? step : staticStep;
}

const QUERY = "(prefers-reduced-motion: reduce)";

/** Tracks `prefers-reduced-motion` (SSR-safe, no library). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
