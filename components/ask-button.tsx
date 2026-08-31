"use client";

import { useChat } from "@/components/chat-provider";
import { RobotMark } from "@/components/robot-mark";

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
   of robot sitting straight on the page, with the light rolling slowly through
   its stroke. The glyph used to be the sparkle; it handed the corner over once
   Summarize existed, because the two now mean different things — the sparkle
   asks about the thing in front of you, this opens the conversation. That's the whole resting state, and it's why the corner works: a
   surface up there would be a second thing competing with the page for the eye,
   where a glyph is just the frame's own furniture. It doesn't wait to be hovered
   to move either — a still page plus one thing already breathing is what points
   at it.

   Hovered (or focused), two things happen and neither of them is a panel. The
   mark's own square tints, so the thing you can click says where it ends; and
   the label comes out from behind the mark and settles to its left, saying what
   the glyph does, its highlight sweeping the same way the mark's does, only
   faster. What doesn't arrive is a surface: no box growing, no edge, no ground
   under the words. The corner's resting claim on the page is one glyph, and
   answering a pointer by posting a panel there spends far more than the answer
   is worth — the button isn't becoming a bigger control, it's telling you its
   name. Two words on the page say that, and the page is already the right
   colour behind them.

   So the tint stops at the glyph. It is the site's own icon-hover ink —
   `--foreground` at 6%, the value every icon button in the assistant uses — and
   not the `--layer` + `--stroke` + shadow the old pill wore. That pair is for a
   surface that has to lift off the page and hold something up; this holds
   nothing up. It's a 36px square saying *here*, and a fill that darkens in light
   and lightens in dark reads as exactly that in both, where a lifted card behind
   one glyph, with the label naked beside it, would read as a chip that lost its
   other half.

   Keeping it to that square is also what lets the hit area be honest. The box is
   36px in every state — the mark's own box, and nothing more — so the tint and
   the target are the same rectangle, and hover starts on the glyph you were
   pointing at and ends when you leave it. There's no 140px of surface that grew
   under the cursor and now has to be walked out of, and no frame where the thing
   you aimed at has moved out from under you. The label hangs outside that box,
   `pointer-events-none`, so it can't hold the state open from ground it never
   earned.

   Why 36 and not the bar's 48: 48 was never a size, it was the bar's row height,
   matched so the chip, the pill and ← read as one row of equal weights. There's
   no row up here. The design puts the mark 19.5px in from the right edge and 17px
   down from the top, and at 36 a box centred on `top-2 right-2` lands its mark's
   centre 26px from each edge against the design's 27.75 / 25.25.

   The glyph inside it is 20px, up from the sparkle's 16.5. 16.5 was chosen to
   match the size the theme toggle used to hold in this spot, so the corner's
   weight wouldn't change hands — but the robot is a denser shape than a
   sparkle. A sparkle is four points around empty space and reads large for its
   box; a robot is an outlined rectangle with two eyes inside it, and at 16.5 the
   eyes were about a pixel and a half tall, which is too small to read as eyes at
   all, let alone to blink. 20 still leaves 8px of ground on every side of the
   36px box.

   Why the label goes left: pinned to the right edge, rightward is off the
   window. `right-full` hangs it off the box's left edge, and `mr-2.5` is what
   holds it clear of it.

   That margin only became necessary when the tint did. Untinted, the box's edge
   was invisible and the only thing the eye measured was letters-to-glyph — which
   the 36px box already paid for, out of the 9.75px of inset it keeps around a
   16.5px mark. Tinted, that edge is a drawn boundary a few px from the final
   't', and 9.75px of air the eye can't see doesn't stop the word from looking
   welded to the square. So the gap is stated: 10px, the inset's own value, which
   puts the same air outside the tint as there is inside it and leaves the glyph
   centred in one continuous gutter rather than crowding one side of it.

   Positioning comes from the caller (components/site-nav), which is also where
   it fades out while the assistant is open — it's already answering.
   ──────────────────────────────────────────────────────────────────────── */

/* The button is only ever the mark's box, so it carries the tint itself rather
   than fading a sheet in under the content the way the pill's ground had to:
   there is nothing here for a background to cover, and a background-colour
   transitions on its own perfectly well.

   The lists are per-property, in the order `transition-property` names them —
   fill first, transform second. The fill takes the label's timing exactly, in
   over 200ms and out over 100, so the two read as one thing arriving and one
   thing leaving rather than as a square and a word that happen to overlap.
   (`hover:` is in effect while arriving, so the base value is the one that runs
   the exit.) The transform is the press, and a press that answers late isn't a
   press, so it holds 150 in every state. */
const SURFACE = [
  "group absolute right-0 top-0 grid h-9 w-9 place-items-center rounded-[12px]",
  "transition-[background-color,transform] ease-out-strong duration-[100ms,150ms]",
  "hover:bg-foreground/[0.06] hover:duration-[200ms,150ms]",
  "focus-visible:bg-foreground/[0.06] focus-visible:duration-[200ms,150ms]",
  "active:scale-[0.97]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25",
].join(" ");

/* It slides the last few pixels rather than appearing in place — it should read
   as coming out from behind the mark, which means moving left, so the resting
   offset is positive.

   With no edge to clip it and no ground to wait for, the label answers on its
   own and the old sequencing goes with them. What's left is the site's usual
   asymmetry: arriving is the flourish and gets 200ms, leaving is just getting
   out of the way and takes 100. `hover:` is in effect while arriving, so the
   base value is the one that runs the exit.

   Vertical centring is the flex box rather than a `-translate-y-1/2`, which
   would have to share the transform with the slide. */
const LABEL = [
  "pointer-events-none absolute right-full top-0 mr-2.5 flex h-9 items-center",
  "shimmer-text whitespace-nowrap text-[14px] font-medium leading-[21px]",
  "translate-x-1.5 opacity-0",
  "transition-[opacity,transform] duration-100 ease-out-strong",
  "group-hover:translate-x-0 group-hover:opacity-100",
  "group-hover:duration-200 group-hover:animate-shimmer",
  "group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
  "group-focus-visible:duration-200 group-focus-visible:animate-shimmer",
].join(" ");

export function AskButton({
  label,
  className = "",
}: {
  /** The copy the label says. Every page passes the same words now ("Ask
      agent") — the corner does one thing, so it says one thing. Nothing
      measures it — it lays out at its natural width — so a longer label is a
      question of what reads well in the corner, not of a number to update. */
  label: string;
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
        /* One thing, everywhere: open the assistant. It used to send a page's
           own prompt when it had one, so on a case study this glyph asked a
           question and on every other page it opened an empty thread — same
           glyph, two behaviours, and no way to tell which you'd get. The
           question is Summarize's job now (components/case-meta), so the corner
           does the one thing it can always do. */
        onClick={() => setOpen(true)}
        className={SURFACE}
      >
        {/* 20px — see the note above on why the robot needs more than the
            sparkle's 16.5 did. */}
        <RobotMark className="size-[20px] text-[var(--nav-fg)]" />
        <span className={LABEL}>{label}</span>
      </button>
    </div>
  );
}
