"use client";

import { useChat } from "@/components/chat-provider";
import { PixelGrid } from "@/components/pixel-grid";
import { askPedro } from "@/lib/ask";

/* ────────────────────────────────────────────────────────────────────────
   The assistant's button.

   It used to be a labelled chip inside the nav pill, which framed it as a third
   section link. It isn't one — the sections move you around the page, this one
   starts a conversation. So it leaves the pill: its own surface, its own shape,
   sat beside the nav rather than inside it.

   At rest it's just the mark — a round chip carrying the same pixel grid the
   chat thinks in, and running the same wave it runs while the chat is thinking.
   It doesn't wait to be hovered to move: a bar of static links plus one thing
   that's already breathing is what points at it. Hover it (or focus it) and it
   opens rightward into a pill and says what it does, the label's highlight
   sweeping as it lands.

   Why the odd nesting: the wrapper holds a fixed 48px in the nav's flex row and
   the button is absolute inside it, so opening overflows to the right instead of
   re-centring the bar. If the row re-centred, the mark would slide left out from
   under the cursor pointing at it — the one thing this animation must not do.
   It's also why the grid lives in its own 48px box: fixed width, so the mark
   doesn't drift as the pill grows past it.
   ──────────────────────────────────────────────────────────────────────── */

/* The open width, and the only magic number here — a button can't transition to
   `max-content`, so the target has to be stated. 48px of mark, ~88px of label
   (14px Inter Medium — the nav links' size, since this reads as part of that
   row), 16px of trailing room. One number covers both copies: "Ask anything"
   and "Ask about it" land within a few px of each other, and slack shows up as
   extra padding on the right, which is the harmless failure. Any label much
   longer than these wants a bigger number, not a longer word. */
const OPEN = "9.5rem"; /* 152px */

/* Opening is the flourish and closing is just getting out of the way, so the
   durations are asymmetric. The trick is which state holds which: `hover:` is
   in effect while opening, and the base value is what's left to run the
   collapse. Both are under 300ms, and `ease-out-strong` front-loads them hard
   enough that the pill is visually most of the way open in the first 90ms. */
const SURFACE = [
  "nav-surface group absolute left-0 top-0 flex h-12 w-12 items-center",
  "overflow-hidden rounded-full",
  "transition-[width,transform] duration-200 ease-out-strong",
  "hover:w-[var(--open-w)] hover:duration-300",
  "focus-visible:w-[var(--open-w)] focus-visible:duration-300",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25",
  "active:scale-[0.97]",
].join(" ");

/* Slides the last few pixels rather than appearing in place — it should read as
   coming out from behind the mark. Runs ahead of the width both ways: landed
   before the pill stops growing, gone before it has finished closing. */
const LABEL = [
  "shimmer-text whitespace-nowrap pr-4",
  "text-[14px] font-medium leading-[21px]",
  "-translate-x-1.5 opacity-0",
  "transition-[opacity,transform] duration-150 ease-out-strong",
  "group-hover:translate-x-0 group-hover:opacity-100 group-hover:duration-200",
  "group-hover:animate-shimmer",
  "group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
  "group-focus-visible:animate-shimmer",
].join(" ");

export function AskButton({
  label,
  prompt,
}: {
  /** The copy the pill opens to say. Pages that are about one thing name it
      ("Ask about it"); the rest just offer ("Ask anything"). */
  label: string;
  prompt?: string;
}) {
  const { setOpen } = useChat();

  return (
    <div className="relative h-12 w-12 shrink-0">
      <button
        type="button"
        onClick={() => (prompt ? askPedro(prompt) : setOpen(true))}
        style={{ "--open-w": OPEN } as React.CSSProperties}
        className={SURFACE}
      >
        <span className="grid size-12 shrink-0 place-items-center">
          <PixelGrid color="bg-[var(--nav-fg)]" />
        </span>
        <span className={LABEL}>{label}</span>
      </button>
    </div>
  );
}
