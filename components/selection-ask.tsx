"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { DOCKED, useChat } from "@/components/chat-provider";
import { SparkMark } from "@/components/spark-mark";
import { askPedro } from "@/lib/ask";
import { SITE_LINKS } from "@/lib/nav";
import { site } from "@/lib/site";

/* ────────────────────────────────────────────────────────────────────────
   Highlight a line, ask about it.

   The assistant already has a front door — the button in the floating bar —
   but that one starts from nothing: you open it and have to think of a
   question. This is the other direction. You're reading, a sentence catches
   you, and the question is already formed by the time you've finished
   dragging over it. So the CTA comes to the selection rather than making you
   carry the selection to the CTA.

   It's the same object as the nav's assistant button — same translucent chip,
   same sparkle with the same light rolling through it — just smaller, because
   it lands on top of body copy rather than sitting in a bar of 48px controls.
   Pressing it sends one composed prompt through `pedro:ask` (lib/ask), which
   is the same contract a case study's "Ask about it" button uses; the rail
   springs open and answers in a fresh thread.

   Portalled to <body>: the page sits inside the shell's `relative z-10`
   wrapper, which is a stacking context, so a pill rendered in place would be
   sealed under the nav and the rail however high its z-index went (the same
   reason components/media-zoom portals).
   ──────────────────────────────────────────────────────────────────────── */

const LABEL = "Ask about this";

/** Below this a selection is a stray double-click, not something to ask about.
    Three, not more: "Jusbrasil" and "A/B" are both fair questions. */
const MIN_CHARS = 3;

/** How much of the selection gets quoted into the prompt. Past a couple of
    sentences the excerpt stops being a question and starts being a document —
    the agent has the whole site in its system prompt anyway, so the quote only
    has to be long enough to point at something. */
const EXCERPT = 420;

const GAP = 10; /* clearance between the pill and the selected line */
const EDGE = 12; /* keep-out from the viewport's sides */
const PILL_H = 32;

/** Only read to keep the pill on screen, so slack is the harmless failure and
    it's stated rather than measured. The chip renders at 133 — 10px of left
    padding, 15px of mark, 8px of gap, 88px of label (13px Inter Medium × 14
    characters), 12px of right padding — and this rounds up from there. A label
    much longer than "Ask about this" wants a bigger number, not a longer
    word. */
const PILL_W = 144;

/** The rail's docked width — `lg:w-96` on the aside in components/ai-chat. */
const RAIL = 384;

/** Where the pill is, and what it will ask about. */
type Spot = { text: string; x: number; y: number; above: boolean };
/** Just the geometry — `place` doesn't know or care about the text. */
type At = Omit<Spot, "text">;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

/**
 * Where the pill goes for a given selection, in viewport coordinates.
 *
 * Above the selection by default — that's the half of the line the reader's
 * eye is already leaving, and it keeps the pill clear of the floating bar at
 * the bottom of the window. It only flips below when the selection is close
 * enough to the top that there's no room, and in that case it can't reach the
 * bar either.
 *
 * Returns null when there's nothing to point at: an empty rect (the range's
 * nodes have gone) or a selection that has scrolled out of the window.
 */
function place(range: Range, right: number): At | null {
  const r = range.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  if (r.bottom < 0 || r.top > window.innerHeight) return null;

  const above = r.top >= PILL_H + GAP + EDGE;
  const half = PILL_W / 2;

  return {
    above,
    x: clamp(r.left + r.width / 2, EDGE + half, right - EDGE - half),
    y: above ? r.top - GAP : r.bottom + GAP,
  };
}

/** The chat's own text is not page content — the rail carries the composer and
    the answers, and offering to ask about an answer inside the thing that just
    gave it is a loop. Marked with `data-ask-selection="off"` on the aside. */
function askable(range: Range): boolean {
  const node = range.commonAncestorContainer;
  const el = node instanceof Element ? node : node.parentElement;
  return !!el && !el.closest('[data-ask-selection="off"], input, textarea');
}

/**
 * Where the quote came from, named the way a person would name it.
 *
 * Read off `document.title` rather than wired through from each page — every
 * route but home renders through the `%s — Pedro Mello` template in
 * app/layout, so stripping the suffix leaves the page's own name. Home's title
 * starts with the name instead and falls through to the path.
 *
 * The noun has to change with the route, because the names do: the site's own
 * pages are one word ("Skills"), while a case study's title is a whole headline
 * ("Turning AI into profit with a 40% revenue lift") — which needs quoting to
 * survive inside a sentence, and is a case study rather than a page. Decided
 * off SITE_LINKS rather than off the shape of the path, so adding a fourth
 * route to the site can't quietly turn it into a case study.
 */
function origin(pathname: string): string {
  const suffix = ` — ${site.name}`;
  const title = document.title;
  const named = title.endsWith(suffix)
    ? title.slice(0, -suffix.length).trim()
    : "";

  if (!named) return pathname === "/" ? "home page" : "site";
  return SITE_LINKS.some((link) => link.href === pathname)
    ? `${named} page`
    : `“${named}” case study`;
}

/**
 * What the visitor "typed". The excerpt is quoted so the agent answers *about*
 * the line rather than reading it as an instruction, and the page it came from
 * is named because half the lines worth highlighting are too short to identify
 * themselves ("measured, not guessed") — naming the case study gives the answer
 * somewhere to land.
 */
function promptFor(text: string, pathname: string): string {
  const quote =
    text.length > EXCERPT ? `${text.slice(0, EXCERPT).trimEnd()}…` : text;

  return `From your ${origin(pathname)}: “${quote}” — what's the thinking behind this?`;
}

/** Enter is movement, so it gets the strong curve; leaving is just getting out
    of the way, and a plain short fade is all a dismissal owes you (the note on
    `ease-out-strong` and opacity in globals.css is the long version). */
const POP = { duration: 0.15, ease: [0.23, 1, 0.32, 1] as const };
const FADE = { duration: 0.1, ease: "easeOut" as const };

export function SelectionAsk() {
  const { open } = useChat();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const [spot, setSpot] = useState<Spot | null>(null);
  /* Flipped once, on the first selection, and never back: the portal has to
     outlive `spot` or AnimatePresence has nothing left to run the exit on.
     It also keeps the tree out of the server render, where there's no
     document.body to portal into. */
  const [live, setLive] = useState(false);
  /* The selection itself, kept so scrolling can re-measure it. Cloned — the
     live Range moves as the user selects again. */
  const rangeRef = useRef<Range | null>(null);

  const showing = spot !== null;

  const hide = useCallback(() => {
    rangeRef.current = null;
    setSpot(null);
  }, []);

  /** The right-hand limit for the pill. When the rail is docked open the
      window's edge isn't the content's edge, and a pill clamped to the window
      would sit on top of the conversation. */
  const rightEdge = useCallback(
    () => window.innerWidth - (open && window.matchMedia(DOCKED).matches ? RAIL : 0),
    [open],
  );

  const read = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return hide();

    const text = sel.toString().replace(/\s+/g, " ").trim();
    if (text.length < MIN_CHARS) return hide();

    const range = sel.getRangeAt(0);
    if (!askable(range)) return hide();

    const at = place(range, rightEdge());
    if (!at) return hide();

    rangeRef.current = range.cloneRange();
    setLive(true);
    setSpot({ ...at, text });
  }, [hide, rightEdge]);

  // A selection is finished when the pointer comes up, or when a run of
  // shift-arrows stops. Both also fire on the gestures that *clear* one, which
  // is why the same handler puts the pill away — `read` hides on a collapsed
  // selection, so a plain click anywhere dismisses it.
  useEffect(() => {
    const onPointerUp = (e: PointerEvent) => {
      // Touch and pen raise the OS's own selection menu, in exactly the place
      // this pill wants to be. Losing that fight looks worse than not showing
      // up — the bar's assistant button is still there for a thumb.
      if (e.pointerType !== "mouse") return hide();
      // The pill is portalled out of the page but the event still bubbles to
      // the document; pressing it must not be read as a new selection.
      if (e.target instanceof Element && e.target.closest("[data-selection-ask]")) return;
      read();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") read();
    };

    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [read, hide]);

  // Stay attached to the line as the page moves under it. A pill that held its
  // viewport position while the text scrolled away would stop being about
  // anything — and once the selection leaves the window, `place` returns null
  // and the moment is over.
  useEffect(() => {
    if (!showing) return;

    let frame = 0;
    const track = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const range = rangeRef.current;
        if (!range) return;
        const at = place(range, rightEdge());
        if (!at) return hide();
        setSpot((s) => (s ? { ...s, ...at } : s));
      });
    };

    window.addEventListener("scroll", track, { passive: true });
    window.addEventListener("resize", track);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", track);
      window.removeEventListener("resize", track);
    };
  }, [showing, hide, rightEdge]);

  // Escape dismisses without touching the selection — same key that closes the
  // rail, so one habit covers both.
  useEffect(() => {
    if (!showing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showing, hide]);

  /* A navigation unmounts the text this was pointing at. React's documented
     adjust-state-on-prop-change pattern rather than an effect: it lands before
     the paint, so the pill is never seen hanging over the page it followed us
     to. `rangeRef` is left stale on purpose — it is only ever read while `spot`
     is set, and the next selection overwrites it. */
  const [route, setRoute] = useState(pathname);
  if (route !== pathname) {
    setRoute(pathname);
    setSpot(null);
  }

  function ask() {
    if (!spot) return;
    // Drop the highlight first: the answer is about to arrive in the rail, and
    // a stripe of inverted text left behind on the page reads as unfinished.
    window.getSelection()?.removeAllRanges();
    hide();
    askPedro(promptFor(spot.text, pathname));
  }

  if (!live) return null;

  return createPortal(
    <AnimatePresence>
      {spot ? (
        <motion.div
          // AnimatePresence tracks children by key; an unkeyed child never
          // completes its exit and stays in the DOM (see media-zoom).
          key="selection-ask"
          data-selection-ask=""
          initial={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.96, y: spot.above ? 4 : -4 }
          }
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, transition: FADE }}
          transition={POP}
          // The offset is CSS `translate`, not `transform`: it's a separate
          // property, so it composes with the scale framer-motion is writing
          // into `transform` instead of being overwritten by it. Origin at the
          // near edge, so the pill grows out of the line rather than at it.
          style={{
            left: spot.x,
            top: spot.y,
            translate: spot.above ? "-50% -100%" : "-50% 0",
            transformOrigin: spot.above ? "bottom center" : "top center",
          }}
          // z-60 places it between the rail's undocked sheet (z-50) and the
          // lightbox (z-80): over the page and the chat, under an enlarged
          // image, which is modal and owns the window while it's up.
          className="nav-surface fixed z-[60] rounded-full"
        >
          <button
            type="button"
            // Keeps the selection — and the pill with it — alive long enough to
            // be clicked. Without this, mousedown on a button collapses the
            // selection, the document's pointerup handler hides the pill, and
            // the click never lands on anything.
            onPointerDown={(e) => e.preventDefault()}
            onClick={ask}
            className="flex h-8 select-none items-center gap-2 rounded-full pl-2.5 pr-3 text-[13px] font-medium leading-none text-[var(--nav-fg)] transition-[background-color,transform] duration-150 ease-out-strong hover:bg-[var(--nav-hover)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25"
          >
            {/* 15px against 13px type — the same width the pixel field held,
                so the pill's stated width still adds up. Colour comes from the
                button's own `text-[var(--nav-fg)]`. */}
            <SparkMark className="size-[15px]" />
            {LABEL}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
