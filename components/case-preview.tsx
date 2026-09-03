"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ANIMATIONS } from "@/lib/animations";
import type { MediaItem } from "@/lib/projects";

/* Card geometry, from the design.

   Height is the fixed dimension and width is a *result*: the media is inset 14
   top and bottom on a 234px stage, takes whatever width its own aspect asks
   for, and the stage closes around it at 27 a side. The walkthrough clip is
   2.0037:1, so 206 of height buys 413 of width and the stage lands on 467 —
   which is the number in the file, arrived at rather than typed. A portrait
   clip would narrow the same card instead of being letterboxed into a box
   drawn for something else.

   Every one of those is the old card's number (165 tall, 330 wide, 4 of
   padding, 9 of radius) scaled by 1.415, which is the design growing the
   preview until it spanned the case row it hung over. That row is gone — the
   card follows the pointer now (see below) — but the size it arrived at is
   still the size, because it was only ever *derived* from the row and it reads
   correctly on its own. The `max-w` on the card is the guard for a viewport
   narrower than it. Nothing in there is stretched to fit: a replaced element
   with a height and an aspect can't be shrunk below the width that ratio asks
   for, so the widest clip keeps all 413 of its width and the insets give
   instead — 23 a side rather than 27. That's the right way round: the frame
   gives, the picture doesn't.

   Which means the three cases in the list want three different widths: 454,
   479 and 408. The card carries that rather than flattening it — a portrait
   clip should narrow the card, not sit letterboxed in a box drawn for something
   else — so the stage takes an explicit width, measured off whichever layer is
   on top. It changes with the picture, in the same frame: the card is a
   different size for a different case, the way it always was when each row
   owned its own. */
const STAGE_H = 234;
const INSET_Y = 14;
const INSET_X = 27;
const MEDIA_H = STAGE_H - INSET_Y * 2;
/** Wide enough that a narrow piece of media still reads as a card, not a slot.
    It's also the width the coded screens get — see below. */
const STAGE_MIN_W = 396;
/** No card past this, or a very wide clip walks out of the reading column. */
const MEDIA_MAX_W = 452;

/* ── The card follows the pointer ────────────────────────────────────────────
   It used to be pinned to the row, opening upward off the row's top edge. Now
   it hangs off the cursor: top-left corner 24px down and to the right, so the
   pointer sits just outside the corner rather than under the picture.

   24 down is measured against the row, not picked: a row is 50px tall and the
   pointer lands somewhere near the middle of it, which puts the card's top edge
   at about the row's bottom edge. So the card covers the rows *below* the one
   you're reading and never the title you're pointing at — which is also what
   keeps the scrim's hole worth having (see .preview-scrim in globals.css).

   ── It arrives late, on purpose ─────────────────────────────────────────────
   The card eases toward the pointer instead of being nailed to it: an
   exponential approach with a ~55ms time constant, so it's ~95% of the way
   there after three frames and reads as being dragged along rather than glued
   on. TAU is in seconds and the step is scaled by the real frame time, so the
   feel is the same on 60Hz and 120Hz — a per-frame lerp would be twice as
   snappy on a ProMotion display.

   Translate only. No rotation and no scale while it travels: the reference this
   was built from holds its card perfectly square at 1500px/s, and a tilt keyed
   to velocity is a different, louder effect than the one being copied. */
/** Pointer → the card's top-left corner. */
const OFFSET = 24;
/** How far the card is allowed to get from the viewport edge. */
const EDGE = 12;
/** Follow smoothing, in seconds. Larger = more drag behind the pointer. */
const TAU = 0.055;

/* ── Swapping between rows ───────────────────────────────────────────────────
   Moving from one row to the next doesn't close the card and open another one:
   the card stays up and the picture changes under it, in one frame. No
   transition on the media at all — no wipe, no fade, no resize. The reference
   this was copied from does run a mask down the incoming picture, and that was
   built and then taken back out on request: the motion belongs to the card
   travelling, and a second animation inside it was one too many.

   So the only thing this has to get right is that the swap be *clean* — see the
   note on the layers below, which is where the work actually is. */

/* Coded animations are page-sized artboards — a 360–520px product card centred
   in whatever box they're given. The preview renders one at that size and
   scales the result down, rather than handing it a 396px box and letting it
   reflow: at thumbnail width the card's 11px labels wrap and the thing stops
   reading as the screen it's a picture of.

   The scale is taken off the *card*, not off the artboard around it: 354 is
   device-control's, the tallest of them, and dividing the media box by it puts
   that screen on exactly the 14px inset the video gets — 206 tall, the same
   88% of the stage's height the clip lands on, and about half its width, which
   is where the design puts it. Scaling to the 380px artboard instead would size
   the empty padding and leave the screen floating small in the middle of the
   thumbnail. A shorter animation simply sits smaller on the stage, the way a
   shorter clip would. What spills past the media box is padding, and the stage
   clips it. */
const ART_W = 440;
const ART_H = 380;
const ART_CARD_H = 354;
const ART_SCALE = MEDIA_H / ART_CARD_H;

/** The media's width before anything has laid out, so the stage opens at the
 *  right size instead of at its floor and then growing.
 *
 *  Exact for a video and for a coded screen, both of which state their box. An
 *  image doesn't — its width is whatever its natural ratio makes it, which
 *  isn't known until it loads — so this is 16/9 for one of those and the
 *  ResizeObserver in the layer corrects it. That correction is the one time the
 *  stage's width transition animates something other than a swap. */
function intrinsicWidth(item: MediaItem): number {
  if (item.type === "component") return STAGE_MIN_W - INSET_X * 2;
  const [w, h] = (item.aspect ?? "16 / 9").split("/").map(parseFloat);
  const ratio = w && h ? w / h : 16 / 9;
  return Math.min(MEDIA_MAX_W, MEDIA_H * ratio);
}

type Layer = { key: string; item: MediaItem };

type Deck = {
  /** A row took the pointer. */
  enter: (key: string, item: MediaItem, rect: DOMRect, x: number, y: number) => void;
  /** A row lost it. Ignored unless that row is the one currently showing —
      leaving row A fires *before* entering row B, so an unguarded leave would
      close the card the next row is about to take over. */
  leave: (key: string) => void;
  activeKey?: string;
  open: boolean;
};

const DeckContext = createContext<Deck | null>(null);

/**
 * The shared preview card for a list of cases.
 *
 * One card for the whole list rather than one per row: it keeps the card up
 * while the pointer crosses from one row to the next, so the travel reads as
 * one object following you rather than three cards taking turns. It also means
 * each row's media is fetched once and then stays mounted for the life of the
 * page, so running the list twice doesn't re-download a 17MB clip. Every case
 * that's ever been hovered keeps a layer here; only the top one is visible.
 *
 * The card is decoration — `aria-hidden`, `pointer-events-none` — and mouse
 * only. A tap on a touch screen is a navigation, not a hover, and a preview
 * that flashes on the way to the page is worse than no preview.
 *
 * ── Why the card is a portal ────────────────────────────────────────────────
 * It used to be `absolute` inside the row's wrapper, which is the simpler thing
 * and was right until the page grew a scrim (see .preview-scrim in
 * globals.css). Chrome's `backdrop-filter` doesn't blur "everything painted
 * below me" the way the spec reads — it blurs the render surface it lands in. A
 * card nested in the list shares that surface with the list, so the scrim
 * blurred the card too, at *any* z-index: 30, 50, 100 all came out soft, and so
 * did the same card as `position: fixed` while it stayed inside that subtree.
 * What does stay sharp is a fixed element parented high — at `main`, at the
 * shell, at `body` — because that composites above the scrim instead of inside
 * its surface. So the card goes to `body` and takes viewport coordinates, which
 * is where the pointer already lives.
 *
 * The cost of viewport coordinates is that they don't follow the page, so a
 * scroll with the pointer still resting on a row would leave the scrim's hole
 * behind even though the card itself would keep up. Scrolling closes it instead
 * — you've moved on, and a hole cut around a row that has since moved is worse
 * than no scrim.
 */
export function CasePreviewDeck({ children }: { children: React.ReactNode }) {
  /* Stable, first-seen order. Never reordered: React would move the DOM nodes
     and the depth ordering is done with z-index instead, which no <video> has
     to survive being re-parented for. */
  const [stack, setStack] = useState<Layer[]>([]);
  const [activeKey, setActiveKey] = useState<string>();
  const [open, setOpen] = useState(false);

  const card = useRef<HTMLDivElement>(null);
  const layers = useRef(new Map<string, HTMLDivElement>());
  /* Each layer's media width, keyed like the layers. Measured rather than
     computed from `item.aspect`: a video declares its ratio and could be done
     with arithmetic, but an image doesn't — its width is whatever its natural
     ratio makes it, which isn't known until it has loaded. A ResizeObserver
     gets both, plus the coded screens, without a special case for any of
     them. */
  const [width, setWidth] = useState<Record<string, number>>({});
  /** Where the pointer is, and where the card has got to. Refs, not state: this
      pair changes every frame and nothing renders off it. */
  const pointer = useRef({ x: 0, y: 0 });
  const at = useRef<{ x: number; y: number } | undefined>(undefined);
  const activeRef = useRef<string | undefined>(undefined);
  const reduced = useRef(false);
  /* Set when the card has actually finished fading out, which is a different
     thing from `open` being false. Leaving row A for row B closes and reopens
     within one batch and the card never goes anywhere — that's a swap, and the
     card should travel to the new row. Leaving the list and coming back later
     is a fresh open, and the card should be *there*, not slide in from wherever
     the pointer left it half a page ago. */
  const dismissed = useRef(true);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = q.matches;
    const sync = () => {
      reduced.current = q.matches;
    };
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  const enter = useCallback(
    (key: string, item: MediaItem, rect: DOMRect, x: number, y: number) => {
      pointer.current = { x, y };
      if (dismissed.current) {
        /* Snap: no travel from the last row the pointer was on, which could be
           the other end of the page. */
        at.current = undefined;
      }
      setStack((s) => (s.some((l) => l.key === key) ? s : [...s, { key, item }]));
      dismissed.current = false;
      setActiveKey(key);
      activeRef.current = key;
      setOpen(true);

      /* Where the scrim shouldn't blur. These go on <html> because the scrim
         isn't in this tree — it's a window-level layer over in the shell — and
         a custom property is the cheapest way to hand it a rectangle without
         threading state through every component in between. Left set on close:
         the scrim is transparent by then, and clearing them would only mean
         writing four properties to say nothing. */
      const root = document.documentElement.style;
      root.setProperty("--preview-hole-x", `${rect.left}px`);
      root.setProperty("--preview-hole-y", `${rect.top}px`);
      root.setProperty("--preview-hole-w", `${rect.width}px`);
      root.setProperty("--preview-hole-h", `${rect.height}px`);
    },
    [],
  );

  const leave = useCallback((key: string) => {
    if (activeRef.current !== key) return;
    setOpen(false);
  }, []);

  /* The follow. Runs only while something is open, and the card keeps the
     position it closed at so re-entering the same row doesn't snap. */
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    let last: number | undefined;

    const step = (now: number) => {
      const el = card.current;
      if (el) {
        /* Corner first, then the two edges that can push back. Flipping to the
           other side of the pointer rather than clamping: a card pinned to the
           bottom of the window would sit *over* the row it belongs to. */
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const { x, y } = pointer.current;
        let left = x + OFFSET;
        let top = y + OFFSET;
        if (left + w > window.innerWidth - EDGE) {
          left = Math.max(EDGE, x - OFFSET - w);
        }
        if (top + h > window.innerHeight - EDGE) {
          top = Math.max(EDGE, y - OFFSET - h);
        }

        const dt = last === undefined ? 0 : Math.min(0.05, (now - last) / 1000);
        last = now;
        const target = at.current ?? { x: left, y: top };
        const k = reduced.current ? 1 : 1 - Math.exp(-dt / TAU);
        target.x += (left - target.x) * k;
        target.y += (top - target.y) * k;
        at.current = target;
        el.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const move = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    const close = () => setOpen(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  /* What a layer reports back once its media has laid out. Stable, so the
     observer inside the layer isn't torn down and rebuilt every render. A width
     it already holds is dropped rather than re-set: the state object keeps its
     identity and React bails out instead of re-rendering the deck on every
     resize callback. */
  const report = useCallback((key: string, w: number) => {
    setWidth((current) =>
      !w || current[key] === w ? current : { ...current, [key]: w },
    );
  }, []);

  /* Play only what's on top, and only while it's on screen. A paused <video>
     costs nothing; one looping behind a picture that covers it costs a decode
     per frame, forever. */
  useEffect(() => {
    layers.current.forEach((el, key) => {
      const video = el.querySelector("video");
      if (!video) return;
      if (open && key === activeKey) video.play().catch(() => {});
      else video.pause();
    });
  }, [open, activeKey, stack]);

  /* The stage's width, in card terms: what the active layer measured, or what
     its media says it will be before it has laid out. */
  const active = stack.find((l) => l.key === activeKey);
  const media =
    (activeKey ? width[activeKey] : undefined) ??
    (active ? intrinsicWidth(active.item) : 0);
  const stageW = Math.max(STAGE_MIN_W, Math.round(media) + INSET_X * 2);

  const deck: Deck = { enter, leave, activeKey, open };

  return (
    <DeckContext.Provider value={deck}>
      {children}
      {stack.length > 0
        ? createPortal(
            <div
              ref={card}
              aria-hidden="true"
              className={[
                // z-30 at the top of the document, which is a different ladder
                // from the one the row's own wrapper is on: out here it clears
                // the shell (z-10) and everything sealed inside it, the
                // window's fades included. It also means the card can cover the
                // floating bar — which it does now, where the row-anchored
                // version couldn't. That's the trade for following the pointer:
                // the bar is a fixed target and the card goes where you point.
                "pointer-events-none fixed left-0 top-0 z-30 rounded-xl bg-background p-1.5",
                "ring-1 ring-stroke dark:ring-[#303030]",
                "shadow-[0_7px_14px_-3px_rgba(17,17,24,0.10),0_17px_34px_-8px_rgba(17,17,24,0.14)]",
                "dark:shadow-[0_12px_19px_rgba(0,0,0,0.4)]",
                // Opacity and scale only. `transform` is written every frame by
                // the follow loop above, so it must not also be a transition
                // property or the two fight over the same value.
                "transition-[opacity,scale] duration-200 ease-out-strong",
                "motion-reduce:scale-100",
                open ? "scale-100 opacity-100" : "scale-[0.98] opacity-0",
              ].join(" ")}
              style={{ maxWidth: `calc(100vw - ${EDGE * 2}px)` }}
              onTransitionEnd={(event) => {
                if (event.propertyName === "opacity" && !open) {
                  dismissed.current = true;
                }
              }}
            >
              {/* The stage. One neutral field for every kind of media, so a
                  video, a screenshot and a coded screen all read as the same
                  object seen at the same size — the same treatment the
                  case-study gallery gives them, at a twelfth of the area.

                  Fixed height, padding for the inset, and a width that comes
                  from whichever layer is on top (see the note up the file). */}
              <div
                className="relative flex items-center justify-center overflow-hidden rounded-lg bg-hover"
                style={{
                  height: STAGE_H,
                  paddingInline: INSET_X,
                  width: stageW,
                  /* Not `min(…, 100%)`: the card has no width of its own — it
                     shrink-wraps this — so a percentage here resolves against
                     nothing and collapses the stage to its padding. The card's
                     own `max-width` is what a narrow window pushes back with,
                     and `max-width: 100%` lets the stage follow it down. */
                  maxWidth: "100%",
                }}
              >
                {stack.map(({ key, item }) => (
                  <div
                    key={key}
                    ref={(el) => {
                      if (el) layers.current.set(key, el);
                      else layers.current.delete(key);
                    }}
                    /* Every layer absolute, so none of them can size the stage
                       — the stage is told its width instead. They all stay
                       mounted, which is the point of the stack: hovering a case
                       a second time costs nothing.

                       Each one carries the field, not just the picture, and
                       that's load bearing. The media doesn't fill the stage —
                       it's inset 27 a side — and the cases don't agree on a
                       width (a 413px clip, a 388px clip, a 342px coded screen).
                       A layer painting only its picture leaves those insets
                       transparent, and the *wider* media of a case hovered
                       earlier shows through them, framing the current one in
                       slivers of somebody else's project. `bg-hover` per layer
                       makes each a complete picture edge to edge, so the active
                       one covers the rest outright — which is what lets the
                       swap be a plain change of z-order with nothing to
                       animate. */
                    className="absolute inset-0 flex items-center justify-center bg-hover"
                    style={{ zIndex: key === activeKey ? 2 : 1 }}
                  >
                    <Thumbnail item={item} layer={key} onMeasure={report} />
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </DeckContext.Provider>
  );
}

/**
 * One row's hover target.
 *
 * Wraps the link rather than replacing it: the anchor stays whatever the list
 * that owns it says it is, and this only reports the pointer to the deck.
 * Renders nothing extra for a case with no media, or outside a deck, so an
 * unillustrated entry costs a wrapper element and no JavaScript beyond it.
 */
export function CasePreview({
  item,
  children,
}: {
  item?: MediaItem;
  children: React.ReactNode;
}) {
  const deck = useContext(DeckContext);
  const wrapper = useRef<HTMLDivElement>(null);
  /* Identity for the deck's layer map. `useId` rather than the slug, because
     the deck doesn't need to know what a case is — two rows pointing at the
     same case would each get their own layer, which is the harmless answer. */
  const key = useId();

  if (!item || !deck) return <>{children}</>;

  return (
    <div
      ref={wrapper}
      /* What the scrim keys off — one attribute, no state threaded through the
         shell. It reads the deck rather than a local state so that a close the
         row didn't ask for (a scroll) also lifts the blur. Only rows that
         actually have a card ever carry it: a case with no media returns above
         this, so hovering it blurs nothing, which is right — there'd be nothing
         to bring into focus. */
      data-case-preview={
        deck.open && deck.activeKey === key ? "open" : undefined
      }
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = wrapper.current?.getBoundingClientRect();
        if (!rect) return;
        deck.enter(key, item, rect, event.clientX, event.clientY);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        deck.leave(key);
      }}
    >
      {children}
    </div>
  );
}

function Thumbnail({
  item,
  layer,
  onMeasure,
}: {
  item: MediaItem;
  /** Which layer this media belongs to, for the width it reports. */
  layer: string;
  onMeasure: (layer: string, width: number) => void;
}) {
  /* One callback ref for all three media kinds, watching the media itself
     rather than the layer around it — a layer is `inset-0` and therefore
     exactly as wide as the stage whose width this decides, which would make it
     a loop. The observer is per-layer instead of one for the deck so that it
     cannot be asked for before it exists: a deck-level observer is built in an
     effect, and a layer's refs attach before the effects of the tree above it
     run, so the first case hovered would go unmeasured.

     `disconnect` comes back as the ref's cleanup, which React 19 calls in place
     of invoking the ref with null. */
  const measure = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        onMeasure(layer, Math.round(entry.contentRect.width));
      });
      ro.observe(el);
      return () => ro.disconnect();
    },
    [layer, onMeasure],
  );

  if (item.type === "component") {
    const Animation = item.component ? ANIMATIONS[item.component] : undefined;
    if (!Animation) return null;
    return (
      // A window the size of the media box, with the artboard centred in it at
      // half scale. The window is what the stage measures — a bare scaled
      // element still occupies its *unscaled* 440px in layout, and the stage
      // would close around that instead of around the picture. What spills
      // past the window is the artboard's own empty padding; the stage clips
      // it, and the screen itself is well inside.
      <div
        ref={measure}
        className="relative shrink-0"
        style={{ width: STAGE_MIN_W - INSET_X * 2, height: MEDIA_H }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: ART_W,
            height: ART_H,
            translate: "-50% -50%",
            scale: ART_SCALE,
          }}
        >
          <Animation />
        </div>
      </div>
    );
  }

  // Height-first, ratio-derived width: the media is as tall as the stage
  // allows and takes whatever width its own aspect asks for. A 2:1 clip fills
  // the card, a portrait one sits centred in it, and neither is ever cropped.
  const box = { height: MEDIA_H, maxWidth: MEDIA_MAX_W };

  if (item.type === "video") {
    return (
      <video
        ref={measure}
        className="rounded-md object-cover shadow-[0_8px_20px_-7px_rgba(0,0,0,0.28)]"
        style={{ ...box, aspectRatio: item.aspect ?? "16 / 9" }}
        muted
        loop
        playsInline
        preload="none"
        poster={item.poster}
      >
        <source src={item.src} type="video/mp4" />
      </video>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static /public asset; matches the site's existing <img> convention (no next/image)
    <img
      ref={measure}
      src={item.src}
      alt=""
      loading="lazy"
      decoding="async"
      style={box}
      className={`rounded-md object-contain ${
        // Screenshots are white-edged; on the stage they need the hairline to
        // stop at something. Full-bleed art carries its own edge — and so does
        // a window capture, which is what `frame: "own"` says (see
        // MediaItem.frame).
        item.frame === true
          ? "border border-border shadow-[0_8px_20px_-7px_rgba(0,0,0,0.28)]"
          : ""
      }`}
    />
  );
}
