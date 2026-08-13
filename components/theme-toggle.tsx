"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Day / night, pinned to the top corner of the screen.
 *
 * It has moved twice: out of the floating bar (whose right-hand slot now belongs
 * to the assistant), briefly into the home page's name row, and now out to the
 * viewport corner. The corner is the better home — it's page furniture, not
 * content, so it belongs to the window rather than to any one column, and it's
 * the same control in the same place on every page instead of one that moves
 * depending on whether a page happens to have a header row.
 *
 * Positioning comes from the caller (components/site-shell) so this stays just
 * the control.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // One-shot hydration guard, not derived state — the rule doesn't apply.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Before mount there's no resolved theme to read, so either icon would be a
  // coin toss; the moon holds the slot, matching the pre-hydration markup.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`grid size-8 shrink-0 place-items-center rounded-full text-muted transition-[color,transform] duration-150 ease-out-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 active:scale-[0.92] ${className}`}
    >
      <span className="relative grid size-[16.5px] place-items-center">
        <Icon lit={!isDark}>
          <path d="M13.125 8.06A5.625 5.625 0 1 1 6.94 1.875 4.375 4.375 0 0 0 13.125 8.06Z" />
        </Icon>
        <Icon lit={isDark}>
          <path d="M7.5 10.625C9.22589 10.625 10.625 9.22589 10.625 7.5C10.625 5.77411 9.22589 4.375 7.5 4.375C5.77411 4.375 4.375 5.77411 4.375 7.5C4.375 9.22589 5.77411 10.625 7.5 10.625Z" />
          <path d="M7.5 0.625V1.875" />
          <path d="M7.5 13.125V14.375" />
          <path d="M2.6375 2.6375L3.525 3.525" />
          <path d="M11.475 11.475L12.3625 12.3625" />
          <path d="M0.625 7.5H1.875" />
          <path d="M13.125 7.5H14.375" />
          <path d="M2.6375 12.3625L3.525 11.475" />
          <path d="M11.475 3.525L12.3625 2.6375" />
        </Icon>
      </span>
    </button>
  );
}

/* Both icons are stacked and crossfaded rather than swapped, so the change of
   state is something you watch happen. They turn as they go — a swap this small
   reads as a flicker without it — and scale from 0.75, never 0: nothing in the
   world arrives from nothing.
   Drawn on the design's exported sun geometry (15-unit box, 1.25 stroke, round
   caps) rendered at 16.5px, which lands the 1.375 stroke width the design
   specifies. The moon is the same stroke language rather than a second icon set. */
function Icon({ lit, children }: { lit: boolean; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`absolute size-[16.5px] transition-[opacity,transform] duration-200 ease-out-strong ${
        lit ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"
      }`}
    >
      {children}
    </svg>
  );
}
