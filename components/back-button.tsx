"use client";

import { useRouter } from "next/navigation";

/* ────────────────────────────────────────────────────────────────────────
   The way back, in the top-left corner of the frame.

   It used to be a 48px chip at the head of the floating bar, which put the one
   control that leaves the page in the same row as the three that move around
   inside it — and cost the bar enough width that below 360px the chip had to
   drop out entirely. The bar is now only the pill.

   So ← took the corner opposite the assistant, and the two bracket the window:
   back out of this page on the left, further into it on the right. Both are 36px
   boxes on `top-2`, so their glyphs land the same distance from the top edge and
   the frame reads as having two corners rather than one corner and a stray
   button. Neither carries a surface at rest — a chip up there would be a second
   thing competing with the page for the eye, where a bare glyph is just the
   frame's own furniture.

   What each does when pointed at is where they part, and they part because they
   promise different things. The mark opposite answers with its name, because
   what it opens is a conversation and the button can't show you that. This one
   has no name to give — an arrow pointing left out of a case study is already
   read — so what it owes a pointer is confirmation that the glyph is a target
   and where its edges are. That's a ground, and it's the site's own hover fill,
   the one the pill's tabs take: a tint, not a card. No ring, no shadow, nothing
   that would read as a panel opening in the corner.

   The box is 36px square in every state, and the tint fills exactly it — so the
   hit area is what it appears to be, starting on the glyph you aimed at and
   ending when you leave it.

   Positioning comes from the caller (components/site-nav), which is also where
   it steps aside on undocked viewports while the assistant is open — there the
   rail is a sheet over the whole window, and a button left underneath it would
   still be in the tab order.
   ──────────────────────────────────────────────────────────────────────── */

/* Arriving is the flourish and gets 200ms; the colour and the press answer at
   the row's usual 150. Leaving takes the same 200 — a ground that snapped off
   the moment the cursor crossed the edge would read as the corner flinching. */
const BUTTON = [
  "grid size-9 shrink-0 place-items-center rounded-[12px]",
  "text-[var(--nav-muted)] transition-[color,background-color,transform]",
  "duration-[150ms,200ms,150ms] ease-out-strong",
  "hover:bg-[var(--nav-hover)] hover:text-[var(--nav-fg)]",
  "focus-visible:bg-[var(--nav-hover)] focus-visible:text-[var(--nav-fg)]",
  "active:translate-y-px",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25",
].join(" ");

export function BackButton({
  href,
  className = "",
}: {
  /** Where ← goes. */
  href: string;
  /** Where the 36px box sits — the caller pins it to the corner. */
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Back"
      title="Back"
      onClick={() => router.push(href)}
      className={`${BUTTON} ${className}`}
    >
      <BackIcon />
    </button>
  );
}

/* Exported from the design's back chip. Path data is Figma's, with the baked
   #7D7D7D swapped for currentColor so the button drives it. */
function BackIcon() {
  return (
    <svg
      width="11"
      height="9"
      viewBox="0 0 10.2315 8.90909"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.45455 8.90909L0 4.45455L4.45455 0L5.22017 0.755682L2.06818 3.90767H10.2315V5.00142H2.06818L5.22017 8.14347L4.45455 8.90909Z"
        fill="currentColor"
      />
    </svg>
  );
}
