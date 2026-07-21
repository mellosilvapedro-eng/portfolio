"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Drives a looping step sequence. `durations[i]` is how long step `i` is held
 * before advancing. When `enabled` is false (reduced motion) the hook returns
 * `staticStep` and never advances, so the UI shows one resolved frame.
 * Pass a module-level `durations` array so its identity stays stable.
 */
export function useLoopStep(
  durations: number[],
  enabled: boolean,
  staticStep = 0,
): number {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let i = 0;
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
  }, [durations, enabled]);

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
