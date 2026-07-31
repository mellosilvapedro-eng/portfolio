"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ChipButton } from "@/components/chip-button";

/** Lives in the floating nav — the round chip on its right end. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // One-shot hydration guard, not derived state — the rule doesn't apply.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <ChipButton
      label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Avoid hydration mismatch: render a neutral icon until mounted */}
      {mounted && isDark ? <SunIcon /> : <MoonIcon />}
    </ChipButton>
  );
}

/* Both drawn on the sun's exported geometry: 15×15, 1.25 stroke, round caps.
   The design only ships the sun (it's dark-mode only), so the moon is the same
   stroke language rather than a second icon set. */
const stroke = {
  width: 15,
  height: 15,
  viewBox: "0 0 15 15",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function MoonIcon() {
  return (
    <svg {...stroke}>
      <path d="M13.125 8.06A5.625 5.625 0 1 1 6.94 1.875 4.375 4.375 0 0 0 13.125 8.06Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg {...stroke}>
      <path d="M7.5 10.625C9.22589 10.625 10.625 9.22589 10.625 7.5C10.625 5.77411 9.22589 4.375 7.5 4.375C5.77411 4.375 4.375 5.77411 4.375 7.5C4.375 9.22589 5.77411 10.625 7.5 10.625Z" />
      <path d="M7.5 0.625V1.875" />
      <path d="M7.5 13.125V14.375" />
      <path d="M2.6375 2.6375L3.525 3.525" />
      <path d="M11.475 11.475L12.3625 12.3625" />
      <path d="M0.625 7.5H1.875" />
      <path d="M13.125 7.5H14.375" />
      <path d="M2.6375 12.3625L3.525 11.475" />
      <path d="M11.475 3.525L12.3625 2.6375" />
    </svg>
  );
}
