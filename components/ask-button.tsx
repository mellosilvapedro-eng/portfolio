"use client";

import { useChat } from "@/components/chat-provider";
import { SparkMark } from "@/components/spark-mark";
import { askPedro } from "@/lib/ask";

/* ────────────────────────────────────────────────────────────────────────
   The assistant's button.

   It used to be a labelled chip inside the nav pill, which framed it as a third
   section link. It isn't one — the sections move you around the page, this one
   starts a conversation. So it left the pill, and then the bar as well: it sits
   in the top-right corner of the frame, having traded places with the theme
   control, which went the other way and took the pill's last slot.

   The trade sorts the two by kind. Three routes and a two-state switch are alike
   — small, instant, finished the moment you let go — and belong in one row. The
   assistant isn't any of those; it opens a conversation down the right-hand side
   of the window, and the corner it now sits in is the top of that side.

   At rest it is the mark and nothing else. No chip, no ground, no edge — 16.5px
   of sparkle sitting straight on the page, with the light rolling slowly through
   its stroke. That's the whole resting state, and it's why the corner works: a
   surface up there would be a second thing competing with the page for the eye,
   where a glyph is just the frame's own furniture. It doesn't wait to be hovered
   to move either — a still page plus one thing already breathing is what points
   at it.

   Hover it (or focus it) and the button assembles: the surface fades up under
   the mark, the box opens leftward into the design's 140 × 36, and the label
   arrives saying what it does, its highlight sweeping the same way the mark's
   does, only faster. The corners are 12px rather than the bar's full round —
   this isn't in the bar, and a pill up here would read as a stray nav chip.

   Why it's 36 and not the bar's 48: 48 was never a size, it was the bar's row
   height, matched so the chip, the pill and ← read as one row of equal weights.
   There's no row up here. The design puts the mark 19.5px in from the right edge
   and 17px down from the top, and at 36 a box centred on `top-2 right-2` lands
   its mark's centre 26px from each edge against the design's 27.75 / 25.25,
   while leaving the surface 8px of ground for when it appears.

   The opening is leftward, because pinned to the right edge rightward is off the
   window — so the button is anchored `right-0` in its box and the row is
   reversed, which puts the mark against that edge and spills the growing width
   into the page instead.

   That flip costs the reveal, and paying for it is what the delays below are.
   In the bar the label was clipped by the growing edge and that *was* the
   animation: mark on the left, so the clip swept away from the text's start and
   uncovered it a letter at a time, left to right, the way it's read. Mirrored,
   the same clip uncovers the word from its last letter backwards — "…g",
   "…hing", "…anything" — and on the way out eats it from "A" forwards, which
   doesn't read as a control closing, it reads as the text rewinding. So the clip
   stops being the animation here. The three moves are sequenced instead: the
   surface and the width go out together and the label lands behind them; coming
   back the label goes first, then the width, and the surface holds until there's
   nothing left to hold up. The clip never gets a partial word to show.

   Why the odd nesting: the wrapper holds a fixed 36px, and the button is
   absolute inside it, so opening overflows the box rather than moving the mark.
   The mark must not drift out from under the cursor pointing at it — the one
   thing this animation must not do. It's also why the mark lives in its own 36px
   box: fixed width, so it stays put as the pill grows past it.

   Positioning comes from the caller (components/site-nav), which is also where
   it fades out while the assistant is open — it's already answering.
   ──────────────────────────────────────────────────────────────────────── */

/* The open width, and the only magic number here — a button can't transition to
   `max-content`, so the target has to be stated. It's the design's own box, and
   every part of it is a number the design gives: a 36px square for the mark, 88
   of label (14px Inter Medium — the nav links' size, since this is still that
   row's voice), 16 of leading room. One number covers both copies: "Ask
   anything" and "Ask about it" land within a few px of each other, and slack
   shows up as extra padding, which is the harmless failure. Any label much
   longer than these wants a bigger number, not a longer word. */
const OPEN = "8.75rem"; /* 140px = 36 + 88 + 16 */

/* Opening is the flourish and closing is just getting out of the way, so the
   durations are asymmetric. The trick is which state holds which: `hover:` is
   in effect while opening, and the base value is what's left to run the
   collapse. Both are under 300ms, and `ease-out-strong` front-loads them hard
   enough that the pill is visually most of the way open in the first 90ms.

   `flex-row-reverse` is what aims it: main-start becomes the right edge, so the
   mark sits there, the label lays out to its left, and the width the button
   gains is revealed on the left rather than the right.

   The lists are per-property, in the order `transition-property` names them —
   width first, transform second. Only the width waits: it holds 100ms on the way
   back so the label is already gone before the edge starts eating it, and takes
   none on the way out because there the label is the one that waits. The
   transform is the press, and a press that answers late isn't a press, so its
   delay is zero in every state. */
const SURFACE = [
  "group absolute right-0 top-0 flex h-9 w-9 flex-row-reverse items-center",
  "overflow-hidden rounded-[12px]",
  "transition-[width,transform] ease-out-strong duration-[200ms,150ms] delay-[100ms,0ms]",
  "hover:w-[var(--open-w)] hover:duration-[300ms,150ms] hover:delay-[0ms,0ms]",
  "focus-visible:w-[var(--open-w)] focus-visible:duration-[300ms,150ms] focus-visible:delay-[0ms,0ms]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25",
  "active:scale-[0.97]",
].join(" ");

/* The ground, as its own layer rather than a class on the button, because it has
   to arrive and leave rather than simply be there: a background, a shadow and an
   outline don't cross-fade if you toggle the class that carries them, and
   putting opacity on the button itself would take the mark with it. So it's a
   sheet under the content, and only it fades.

   It is deliberately *not* `.nav-surface`, which is the bar's paint and only
   works where the bar is. That surface is a translucent veil — white at 0.75 in
   light — and a veil needs something behind it to veil. Over the page's #fcfcfc
   it composites to about #fefefe: two points, which is nothing. The bar gets
   away with it by floating over copy and images, where the same 0.75 reads
   immediately; the dark theme gets away with it because rgba(24,24,24,0.75) over
   #0a0a0a still lands ten points clear. An empty white corner has neither
   excuse.

   So this one is painted rather than veiled, in the pair the site already uses
   for a surface that has to lift off the page with nothing to help it: --layer
   for the fill and --stroke for the hairline. That pair is a ~10-point step from
   the ground in both themes by construction (#fcfcfc → #f2f2f2, #0a0a0a →
   #151515), which is exactly the separation the veil was failing to deliver in
   one of them. It's also the assistant rail's own surface — fitting, for the
   button that opens it. The nav's shadow stays: the lift is the same lift.

   Its timing is the width's, exactly: in fast and immediately, out only once the
   box has finished shrinking back to the mark. That last part is the point — a
   ground that left first would show a label and a naked mark collapsing in open
   air. */
const GROUND = [
  "absolute inset-0 rounded-[12px] bg-layer ring-1 ring-stroke",
  "shadow-[var(--nav-shadow)]",
  "opacity-0 transition-opacity ease-out-strong duration-200 delay-100",
  "group-hover:opacity-100 group-hover:duration-150 group-hover:delay-0",
  "group-focus-visible:opacity-100 group-focus-visible:duration-150",
  "group-focus-visible:delay-0",
].join(" ");

/* Slides the last few pixels rather than appearing in place — it should read as
   coming out from behind the mark, which now means moving left, so the resting
   offset is positive where the bar's version was negative.

   It doesn't run ahead of the width; it takes turns with it. Opening, it waits
   150ms — by which point `ease-out-strong` has the pill most of the way out —
   and lands with it. Closing, it has no delay at all and only 100ms to spend, so
   the word is gone well before the edge that would have clipped it reaches it.
   Out fast, in late: the asymmetry is the same one the width has, pointed the
   other way. */
const LABEL = [
  "relative shimmer-text whitespace-nowrap pl-4",
  "text-[14px] font-medium leading-[21px]",
  "translate-x-1.5 opacity-0",
  "transition-[opacity,transform] duration-100 ease-out-strong",
  "group-hover:translate-x-0 group-hover:opacity-100",
  "group-hover:duration-150 group-hover:delay-150",
  "group-hover:animate-shimmer",
  "group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
  "group-focus-visible:duration-150 group-focus-visible:delay-150",
  "group-focus-visible:animate-shimmer",
].join(" ");

export function AskButton({
  label,
  prompt,
  className = "",
}: {
  /** The copy the pill opens to say. Pages that are about one thing name it
      ("Ask about it"); the rest just offer ("Ask anything"). */
  label: string;
  prompt?: string;
  /** Where the 36px box sits. It must carry a position — the caller pins it to
      the corner with `fixed` (components/site-nav) — because the button inside
      is absolute and resolves against it. Deliberately not defaulted to
      `relative` here: two position utilities on one element are settled by the
      order Tailwind emits them in, not by the order they're written, so a base
      `relative` would quietly outrank the caller's `fixed` and drop the button
      back into the page flow. */
  className?: string;
}) {
  const { setOpen } = useChat();

  return (
    <div className={`h-9 w-9 shrink-0 ${className}`}>
      <button
        type="button"
        aria-label={label}
        onClick={() => (prompt ? askPedro(prompt) : setOpen(true))}
        style={{ "--open-w": OPEN } as React.CSSProperties}
        className={SURFACE}
      >
        <span aria-hidden="true" className={GROUND} />
        {/* `relative` on both, so they paint over the ground. Among children of
            one stacking context the positioned ones go last and in source order,
            and the ground is positioned — without this it would cover the mark
            it's meant to sit behind. */}
        <span className="relative grid size-9 shrink-0 place-items-center">
          {/* 16.5px, the size the design draws the corner mark at — and the size
              of the glyph the theme toggle used to hold in this same spot, so
              the corner's weight doesn't change hands. */}
          <SparkMark className="size-[16.5px] text-[var(--nav-fg)]" />
        </span>
        <span className={LABEL}>{label}</span>
      </button>
    </div>
  );
}
