"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Day / night, at the end of the nav pill.
 *
 * It has wandered: out of the floating bar into the home page's name row, out
 * again to the corner of the window, and now back into the bar — this time
 * *inside* the pill rather than beside it, in the slot the design gives it after
 * Projects. It trades places with the assistant, which has taken the corner.
 *
 * Being in the pill is what settles it. This is a two-state switch: you press
 * it, it's done, and nothing follows. That's the same kind of thing the three
 * routes beside it are, and unlike the assistant, which opens a conversation.
 * So it wears the pill's language rather than the page's — the links' muted ink,
 * their hover ground, their focus ring — and reads as the fourth item in a row
 * of four instead of a control parked nearby.
 *
 * The design's slot is 30px in a 44px pill; `size-8` in our 48px one is the same
 * ratio, and it holds the 16.5px glyph the corner version had.
 *
 * Positioning comes from the caller (components/site-nav) so this stays just
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
      className={`grid size-8 shrink-0 place-items-center rounded-full text-[var(--nav-muted)] transition-[color,background-color,transform] duration-150 ease-out-strong hover:bg-[var(--nav-hover)] hover:text-[var(--nav-fg)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25 ${className}`}
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
