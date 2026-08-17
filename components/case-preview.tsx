"use client";

import { useEffect, useRef, useState } from "react";
import { ANIMATIONS } from "@/lib/animations";
import type { MediaItem } from "@/lib/projects";

/* Card geometry, from the design.

   Height is the fixed dimension and width is a *result*: the media is inset 10
   top and bottom on a 165px stage, takes whatever width its own aspect asks
   for, and the stage closes around it at 20 a side. The walkthrough clip is
   2.0037:1, so 145 of height buys 290 of width and the stage lands on 330 —
   which is the number in the file, arrived at rather than typed. A portrait
   clip would narrow the same card instead of being letterboxed into a box
   drawn for something else. */
const STAGE_H = 165;
const INSET_Y = 10;
const INSET_X = 20;
const MEDIA_H = STAGE_H - INSET_Y * 2;
/** Wide enough that a narrow piece of media still reads as a card, not a slot.
    It's also the width the coded screens get — see below. */
const STAGE_MIN_W = 280;
/** No card past this, or a very wide clip walks out of the reading column. */
const MEDIA_MAX_W = 320;
/** Stage + its padding + the 8px it sits off the link. What the flip needs. */
const CARD_H = STAGE_H + 8 + 8;

/* Coded animations are page-sized artboards — a 360–520px product card centred
   in whatever box they're given. The preview renders one at that size and
   scales the result down, rather than handing it a 280px box and letting it
   reflow: at thumbnail width the card's 11px labels wrap and the thing stops
   reading as the screen it's a picture of.

   The scale is taken off the *card*, not off the artboard around it: 354 is
   device-control's, the tallest of them, and dividing the media box by it puts
   that screen on exactly the 10px inset the video gets — 145 tall, 148 wide,
   which is where the design puts it (87% of the stage's height, half its
   width). Scaling to the 380px artboard instead would size the empty padding
   and leave the screen floating small in the middle of the thumbnail. A
   shorter animation simply sits smaller on the stage, the way a shorter clip
   would. What spills past the media box is padding, and the stage clips it. */
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

  /* Play only while it's on screen. A paused <video> costs nothing; one
     looping behind `opacity-0` costs a decode per frame, forever. */
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (open) el.play().catch(() => {});
    else el.pause();
  }, [open]);

  if (!item) return <>{children}</>;

  function show(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = wrapper.current?.getBoundingClientRect();
    // Above the link, which is where the design puts it — the eye is already
    // travelling down the list, so the card lands in the space it just left.
    // Below only when there isn't room over the link for it.
    if (rect) setBelow(rect.top < CARD_H + 16);
    setSeen(true);
    setOpen(true);
  }

  return (
    <div
      ref={wrapper}
      className="relative"
      onPointerEnter={show}
      onPointerLeave={() => setOpen(false)}
    >
      {children}

      {seen ? (
        <div
          aria-hidden="true"
          /* z-30 clears the window's top and bottom fades (z-20) and stays
             under the floating nav (z-40) — a card that dissolved into the
             page edge would read as a rendering bug, not as depth.
             Left edge on the link's text, not on its padding box, so the card
             lines up with the title it belongs to. */
          className={[
            // No width of its own — an absolute box is shrink-to-fit, so the
            // card is whatever the stage inside it turns out to be. `max-w`
            // because an absolutely positioned card still counts toward the
            // document's scrollable width: on a window too narrow to hold it,
            // it gives up width rather than handing the page a horizontal
            // scrollbar.
            "pointer-events-none absolute left-3 z-30 max-w-[calc(100%-1.5rem)] rounded-[9px] bg-background p-1",
            "ring-1 ring-stroke dark:ring-[#303030]",
            "shadow-[0_5px_10px_-2px_rgba(17,17,24,0.10),0_12px_24px_-6px_rgba(17,17,24,0.14)]",
            "dark:shadow-[0_9px_13px_rgba(0,0,0,0.4)]",
            "transition-[opacity,translate,scale] duration-200 ease-out-strong",
            "motion-reduce:translate-y-0 motion-reduce:scale-100",
            below ? "top-full mt-2" : "bottom-full mb-2",
            open
              ? "translate-y-0 scale-100 opacity-100"
              : `scale-[0.98] opacity-0 ${below ? "-translate-y-1" : "translate-y-1"}`,
          ].join(" ")}
        >
          {/* The stage. One neutral field for every kind of media, so a video,
              a screenshot and a coded screen all read as the same object seen
              at the same size — the same treatment the case-study gallery
              gives them, at a twelfth of the area.

              Fixed height, padding for the inset, and the width left to the
              content: this is where the card gets its size. `min-width` in a
              `min()` so the floor can still yield on a narrow window rather
              than pushing the card past the `max-w` above it. */}
          <div
            className="flex items-center justify-center overflow-hidden rounded-md bg-hover"
            style={{
              height: STAGE_H,
              paddingInline: INSET_X,
              minWidth: `min(${STAGE_MIN_W}px, 100%)`,
            }}
          >
            <Thumbnail item={item} videoRef={video} />
          </div>
        </div>
      ) : null}
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
        className="rounded-[4px] object-cover shadow-[0_6px_14px_-5px_rgba(0,0,0,0.28)]"
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
      className={`rounded-[4px] object-contain ${
        // Screenshots are white-edged; on the stage they need the hairline to
        // stop at something. Full-bleed art carries its own edge.
        item.frame
          ? "border border-border shadow-[0_6px_14px_-5px_rgba(0,0,0,0.28)]"
          : ""
      }`}
    />
  );
}
