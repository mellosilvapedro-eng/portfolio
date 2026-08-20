"use client";

import { useEffect, useRef, useState } from "react";
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
   preview until it spanned the case row it hangs over: 467 of stage plus the
   card's own 12 of padding is 479, and 480 is exactly how wide that row is in
   the file. So the card fills the row, and it gets there by arithmetic rather
   than by being told to. The `max-w` below does the last pixel of the work:
   the code's period column is 10px wider than the design's, so the real row is
   470 rather than 480, and the card clamps to it. What absorbs the difference is
   the insets — a replaced element with a height and an aspect can't be shrunk
   below the width that ratio asks for, so the widest clip keeps all 413 of its
   width and sits on 23 a side instead of 27. That's the right way round: the
   frame gives, the picture doesn't. */
const STAGE_H = 234;
const INSET_Y = 14;
const INSET_X = 27;
const MEDIA_H = STAGE_H - INSET_Y * 2;
/** Wide enough that a narrow piece of media still reads as a card, not a slot.
    It's also the width the coded screens get — see below. */
const STAGE_MIN_W = 396;
/** No card past this, or a very wide clip walks out of the reading column. */
const MEDIA_MAX_W = 452;
/** What the card sits off the row, top or bottom. */
const GAP = 8;
/** Stage + its padding + the gap. What the flip needs. */
const CARD_H = STAGE_H + 12 + GAP;

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

/**
 * A case link that shows its first piece of media on hover.
 *
 * Wraps the link rather than replacing it: the anchor stays whatever the list
 * that owns it says it is, and this adds the card above it. Renders nothing
 * extra for a case with no media, so an unillustrated entry costs a wrapper
 * element and no JavaScript beyond it.
 *
 * The card is decoration — `aria-hidden`, `pointer-events-none` — and mouse
 * only. A tap on a touch screen is a navigation, not a hover, and a preview
 * that flashes on the way to the page is worse than no preview.
 *
 * ── Why the card is a portal ────────────────────────────────────────────────
 * It used to be `absolute` inside this wrapper, anchored to the row with
 * `bottom-full`, which is the simpler thing and was right until the page grew a
 * scrim (see .preview-scrim in globals.css). Chrome's `backdrop-filter` doesn't
 * blur "everything painted below me" the way the spec reads — it blurs the
 * render surface it lands in. A card nested in the list shares that surface with
 * the list, so the scrim blurred the card too, at *any* z-index: 30, 50, 100 all
 * came out soft, and so did the same card as `position: fixed` while it stayed
 * inside this subtree. What does stay sharp is a fixed element parented high —
 * at `main`, at the shell, at `body` — because that composites above the scrim
 * instead of inside its surface. So the card goes to `body` and takes viewport
 * coordinates, measured off the row on hover.
 *
 * The cost of viewport coordinates is that they don't follow the page, so a
 * scroll with the pointer still resting on the row would leave the card behind.
 * Scrolling closes it instead — you've moved on, and a preview sliding out of
 * line with its own row is worse than one that got out of the way.
 *
 * The same measurement does double duty: it also tells the scrim where to leave
 * a hole, so the row's own title stays sharp under the card. One rect, two
 * consumers, so the card and the hole can't drift apart.
 */
export function CasePreview({
  media,
  children,
}: {
  media?: MediaItem[];
  children: React.ReactNode;
}) {
  const item = media?.[0];
  const wrapper = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  /* The card mounts on the first hover and stays mounted — that's what keeps a
     2.5MB clip from being re-fetched every time the pointer crosses the link,
     and it's what gives the close its fade out. Nothing is downloaded until
     someone actually points at the case. */
  const [seen, setSeen] = useState(false);
  const [below, setBelow] = useState(false);
  /* Where the card sits, in viewport coordinates, measured off the row the
     moment the pointer lands on it. `left` and `width` come straight from the
     row — the card is exactly as wide as it, by design — and the anchor is one
     edge or the other, never both, so the card keeps growing away from the row
     rather than being stretched between two numbers. */
  const [box, setBox] = useState<{
    left: number;
    maxWidth: number;
    top?: number;
    bottom?: number;
  }>();

  /* Play only while it's on screen. A paused <video> costs nothing; one
     looping behind `opacity-0` costs a decode per frame, forever. */
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (open) el.play().catch(() => {});
    else el.pause();
  }, [open]);

  /* Viewport coordinates go stale the moment the page moves under them, and the
     pointer can rest on the row while the wheel turns. Close instead of chasing:
     re-measuring on every scroll frame would pin a 470px card to the cursor and
     make the list feel sticky. Only listens while something is open. */
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!item) return <>{children}</>;

  function show(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = wrapper.current?.getBoundingClientRect();
    if (rect) {
      // Above the link, which is where the design puts it — the eye is already
      // travelling down the list, so the card lands in the space it just left.
      // Below only when there isn't room over the link for it.
      const under = rect.top < CARD_H + 16;
      setBelow(under);
      setBox({
        left: rect.left,
        maxWidth: rect.width,
        ...(under
          ? { top: rect.bottom + GAP }
          : { bottom: window.innerHeight - rect.top + GAP }),
      });
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
    }
    setSeen(true);
    setOpen(true);
  }

  return (
    <div
      ref={wrapper}
      /* What the scrim keys off — one attribute, no state threaded through the
         shell. Only rows that actually have a card ever carry it: a case with no
         media returns above this, so hovering it blurs nothing, which is right —
         there'd be nothing to bring into focus. */
      data-case-preview={open ? "open" : undefined}
      className="relative"
      onPointerEnter={show}
      onPointerLeave={() => setOpen(false)}
    >
      {children}

      {seen && box
        ? createPortal(
            <div
              aria-hidden="true"
              /* Left edge and width are the row's: the card is as wide as the
                 case row and shares its left edge, so the two read as one
                 object rather than as a popover floating near a link.
                 `maxWidth` rather than `width`, so the card is still whatever
                 the stage inside it turns out to be — a narrow piece of media
                 gets a narrow card, and only the widest clip is clamped to the
                 row (see the geometry note at the top of the file). */
              style={box}
              className={[
                // z-30 at the top of the document, which is a different
                // ladder from the one this used to be on: out here it clears
                // the shell (z-10) and everything sealed inside it, the
                // window's fades included. It also means the card can cover the
                // floating bar, where before the bar won. In practice it
                // doesn't — the card opens *upward*, and it only flips below
                // the row when the row is near the top of the viewport, which
                // is the one place the bar isn't.
                "pointer-events-none fixed z-30 rounded-xl bg-background p-1.5",
                "ring-1 ring-stroke dark:ring-[#303030]",
                "shadow-[0_7px_14px_-3px_rgba(17,17,24,0.10),0_17px_34px_-8px_rgba(17,17,24,0.14)]",
                "dark:shadow-[0_12px_19px_rgba(0,0,0,0.4)]",
                "transition-[opacity,translate,scale] duration-200 ease-out-strong",
                "motion-reduce:translate-y-0 motion-reduce:scale-100",
                open
                  ? "translate-y-0 scale-100 opacity-100"
                  : `scale-[0.98] opacity-0 ${below ? "-translate-y-1" : "translate-y-1"}`,
              ].join(" ")}
            >
              {/* The stage. One neutral field for every kind of media, so a
                  video, a screenshot and a coded screen all read as the same
                  object seen at the same size — the same treatment the
                  case-study gallery gives them, at a twelfth of the area.

                  Fixed height, padding for the inset, and the width left to the
                  content: this is where the card gets its size. `min-width` in
                  a `min()` so the floor can still yield on a narrow row rather
                  than pushing the card past the `maxWidth` set above it. */}
              <div
                className="flex items-center justify-center overflow-hidden rounded-lg bg-hover"
                style={{
                  height: STAGE_H,
                  paddingInline: INSET_X,
                  minWidth: `min(${STAGE_MIN_W}px, 100%)`,
                }}
              >
                <Thumbnail item={item} videoRef={video} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Thumbnail({
  item,
  videoRef,
}: {
  item: MediaItem;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
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
        ref={videoRef}
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
      src={item.src}
      alt=""
      loading="lazy"
      decoding="async"
      style={box}
      className={`rounded-md object-contain ${
        // Screenshots are white-edged; on the stage they need the hairline to
        // stop at something. Full-bleed art carries its own edge.
        item.frame
          ? "border border-border shadow-[0_8px_20px_-7px_rgba(0,0,0,0.28)]"
          : ""
      }`}
    />
  );
}
