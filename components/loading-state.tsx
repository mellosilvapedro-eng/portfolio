"use client";

import { useEffect, useState } from "react";
import { CHEVRON, ORBIT, PixelGrid } from "@/components/pixel-grid";

/* ────────────────────────────────────────────────────────────────────────
   Loading state — a pixel-grid loader for work that takes a moment.

   Variants:
     Drive  — square cells, a chevron wavefront driving right; the 650ms cycle
              is shorter than the sweep, so two fronts are always in flight
     Dots   — the same wavefront, circular cells
     Orbit  — a comet lapping the grid perimeter

   Paired with a shimmering label and a live elapsed timer in mono tabular
   figures. Reduced motion freezes the grid on its dim state (handled in
   globals.css, where the keyframes live); the timer still ticks.

   The grid itself lives in components/pixel-grid.
   ──────────────────────────────────────────────────────────────────────── */

type Pattern = { delays: (number | null)[]; duration: number; round: boolean };

const PATTERNS = {
  Drive: { delays: CHEVRON, duration: 650, round: false },
  Dots: { delays: CHEVRON, duration: 650, round: true },
  Orbit: { delays: ORBIT, duration: 950, round: false },
} satisfies Record<string, Pattern>;

/**
 * Wall-clock since mount, to a tenth of a second. Measured against a start
 * stamp rather than counted up, so a throttled or backgrounded tab reports the
 * time that actually passed instead of the ticks it managed to fire.
 */
function useElapsed(): string {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const t = setInterval(() => setMs(performance.now() - start), 100);
    return () => clearInterval(t);
  }, []);

  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${(s % 60).toFixed(1)}s`;
}

export function LoadingState({
  label = "Thinking",
  variant = "Drive",
}: {
  label?: string;
  variant?: keyof typeof PATTERNS;
}) {
  const elapsed = useElapsed();
  const { delays, duration, round } = PATTERNS[variant] ?? PATTERNS.Drive;

  return (
    <div className="flex w-fit items-center gap-2.5">
      <PixelGrid delays={delays} duration={duration} round={round} />
      <span className="shimmer-text animate-shimmer text-[13px] font-medium">
        {label}
      </span>
      {/* Hidden from AT: a figure that changes ten times a second is noise to
          read out, and the label already says what's happening. */}
      <span aria-hidden className="font-mono text-[12px] tabular-nums text-muted">
        {elapsed}
      </span>
    </div>
  );
}
