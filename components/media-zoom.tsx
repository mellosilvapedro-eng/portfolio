"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ANIMATIONS,
  DEFAULT_ZOOM_MAX_WIDTH,
  ZOOM_MAX_WIDTH,
  type AnimationProps,
} from "@/lib/animations";
import type { MediaItem } from "@/lib/projects";

/**
 * The morph. One spring, shared by the thumbnail and the enlarged copy through
 * `layoutId` — the tile doesn't fade into a modal, it *becomes* the modal, so
 * you never lose track of which thing you opened. No bounce: this confirms a
 * click, it doesn't perform.
 */
const MORPH = { type: "spring" as const, duration: 0.4, bounce: 0 };

/**
 * Plain ease for the scrim. `ease-out-strong` is ~85% done in the first third
 * of its duration, which is right for movement and wrong for opacity — it makes
 * a fade read as a cut (see the note on the same curve in globals.css).
 */
const FADE = { duration: 0.22, ease: "easeOut" as const };

const PANEL_SHADOW = "0 28px 72px -28px rgba(0,0,0,0.4)";

/**
 * Seats a framed tile on its stage. Per theme, because a single value can't
 * serve both grounds: pure black at 0.28 is a dark-ground number, and on the
 * light theme's near-white stage it reads as grime rather than depth (the same
 * note --nav-shadow carries in globals.css). Light gets the site's tinted ink
 * at a fraction of that — a 1px contact layer to land the edge, and a short
 * soft one under it. Kept lighter than instinct suggests: the screenshots are
 * white at their own edges, so the tile's border already draws the boundary and
 * anything more than a hint under it reads as a dark band rather than lift.
 * Dark keeps real black, and more of it: on #0a0a0a a shadow has to be dense
 * before it registers as anything at all.
 */
const TILE_SHADOW = [
  "shadow-[0_1px_1px_rgba(17,17,24,0.02),0_6px_16px_-14px_rgba(17,17,24,0.045)]",
  "dark:shadow-[0_1px_3px_rgba(0,0,0,0.22),0_16px_36px_-20px_rgba(0,0,0,0.38)]",
].join(" ");

/**
 * The same job for a video, which needs more of it.
 *
 * TILE_SHADOW is deliberately almost nothing on the light theme, and the reason
 * is in the note above: a screenshot is white at its own edges and carries a
 * `border`, so the boundary is already drawn and the shadow only has to hint at
 * lift. A video has no border here — it's a bare rounded rectangle of moving
 * image on a near-white stage — so that hint leaves its edge undefined and the
 * tile reads as flat.
 *
 * So: still light, just present. A 1px contact layer to seat the edge and one
 * short soft cast under it, at roughly three times TILE_SHADOW's light-theme
 * alpha — which lands near the value the hover card already uses for its own
 * video (see components/case-preview). Dark barely moves; real black on #0a0a0a
 * was already registering.
 */
const VIDEO_SHADOW = [
  "shadow-[0_1px_2px_rgba(17,17,24,0.05),0_8px_20px_-10px_rgba(17,17,24,0.16)]",
  "dark:shadow-[0_1px_3px_rgba(0,0,0,0.26),0_18px_40px_-20px_rgba(0,0,0,0.42)]",
].join(" ");

/** Viewport inset of the lightbox — must track the `p-4 sm:p-10` below. */
const INSET = (width: number) => (width < 640 ? 32 : 80);

type Box = { w: number; h: number; card: number };

/**
 * The largest scale at which `box` still fits both the viewport and its own
 * width ceiling.
 *
 * The ceiling is on the *rendered width*, not on the scale factor, because the
 * cards aren't the same size to begin with — 360px for the device screens,
 * 440px for the code entry, 520px for the segmented hero. Capping the factor
 * enlarged the wide ones far past the narrow ones. The ceiling itself is per
 * animation; see ZOOM_MAX_WIDTH.
 *
 * Allowed below 1: on a short window a card that would overflow has to come
 * down rather than get clipped.
 */
function fitScale(box: Box, maxCardWidth: number) {
  const inset = INSET(window.innerWidth);
  return Math.min(
    maxCardWidth / box.card,
    (window.innerWidth - inset) / box.w,
    (window.innerHeight - inset) / box.h,
  );
}

/**
 * Measures the artboard of a coded animation inside its tile.
 *
 * Every animation in the registry has the same shape — a `role="img"` root that
 * fills the stage and centres one card as its first element child — so the box
 * worth enlarging is that card plus the root's own padding, not the root, which
 * is mostly empty stage on a wide tile.
 *
 * `offsetWidth/Height` rather than `getBoundingClientRect`, deliberately: the
 * cards animate their own `scale` as they cycle, so the visual box at the
 * moment of the click is not the layout box we want to rebuild.
 */
/** Resolves a registry key to its animation. Renders nothing for a bad key. */
function TileAnimation({
  name,
  immediate,
}: { name?: string } & AnimationProps) {
  const Animation = name ? ANIMATIONS[name] : undefined;
  return Animation ? <Animation immediate={immediate} /> : null;
}

function measureArtboard(trigger: HTMLElement | null): Box | null {
  const root = trigger?.querySelector<HTMLElement>('[role="img"]');
  const card = root?.firstElementChild as HTMLElement | null;
  if (!root || !card) return null;

  const style = getComputedStyle(root);
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  return {
    w: card.offsetWidth + padX,
    h: card.offsetHeight + padY,
    card: card.offsetWidth,
  };
}

/**
 * A case-study image or video that opens into a lightbox on click.
 *
 * Both copies of the media stay mounted and share a `layoutId`, so the
 * thumbnail and the enlarged version are one continuous object. Videos carry
 * their playhead across in both directions — a demo that restarted from frame
 * zero on zoom would read as a different clip.
 *
 * Portalled to `<body>`: the page content sits inside the shell's
 * `relative z-10` wrapper, which is a stacking context, so anything rendered
 * in place would be sealed underneath the nav and the assistant rail no matter
 * how high its z-index went.
 */
export function MediaZoom({ item }: { item: MediaItem }) {
  const [open, setOpen] = useState(false);
  /**
   * The portal target is `document.body`, which doesn't exist while this
   * renders on the server. Flipped from the click rather than from a mount
   * effect: an effect that calls setState only to discover it's on the client
   * costs every tile on the page a second render, and this tree isn't needed
   * until someone actually opens something.
   */
  const [portalReady, setPortalReady] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbVideo = useRef<HTMLVideoElement>(null);
  const zoomVideo = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  const isVideo = item.type === "video";
  const isComponent = item.type === "component";
  /* A clip to be watched rather than a moving thumbnail (see MediaItem.sound).
     Every browser refuses to autoplay audible video, so the tile stays muted
     no matter what — but opening the lightbox is a click, and a click is the
     user gesture that earns the audio. So the sound, the controls and the
     from-the-top start all live in the enlarged copy. */
  const withSound = isVideo && !!item.sound;
  const label = item.alt ?? item.caption ?? "media";
  const aspect = item.aspect ?? "16 / 9";

  // Shared-layout key. Dropped under reduced motion so the two copies stop
  // being one object and simply cross-fade in place.
  const layoutId = `zoom-${useId()}`;
  const shared = reduce ? undefined : layoutId;

  /**
   * Coded animations are laid out in CSS, not pixels — a card capped at
   * `max-w-[360px]` is 360px wide however much room you give it, so putting one
   * in a bigger box enlarges nothing. Their zoom is a real transform, and it
   * needs the artboard's layout size, measured off the tile at click time.
   */
  const [artboard, setArtboard] = useState<Box | null>(null);
  const [zoom, setZoom] = useState(1);

  const maxCardWidth =
    (item.component ? ZOOM_MAX_WIDTH[item.component] : undefined) ??
    DEFAULT_ZOOM_MAX_WIDTH;

  const openZoom = useCallback(() => {
    if (isComponent) {
      const box = measureArtboard(triggerRef.current);
      setArtboard(box);
      // Resolved here rather than in an effect so the first painted frame is
      // already the right size — measuring after mount would show one frame at
      // 1× and then jump.
      setZoom(box ? fitScale(box, maxCardWidth) : 1);
    }
    setPortalReady(true);
    setOpen(true);
  }, [isComponent, maxCardWidth]);

  const close = useCallback(() => {
    // Hand the playhead back before the enlarged copy unmounts. Not for a
    // narrated clip: the tile is a silent loop and shouldn't be dragged to
    // wherever the viewer happened to stop watching.
    if (!withSound && zoomVideo.current && thumbVideo.current) {
      thumbVideo.current.currentTime = zoomVideo.current.currentTime;
    }
    setOpen(false);
  }, [withSound]);

  // Pick the enlarged video up where the thumbnail left off — again, only for
  // a decorative loop. A clip with narration has a beginning, and joining it
  // mid-sentence because the tile had been running is the wrong start.
  useEffect(() => {
    if (!open || withSound || !thumbVideo.current || !zoomVideo.current) return;
    zoomVideo.current.currentTime = thumbVideo.current.currentTime;
  }, [open, withSound]);

  // Keep an enlarged animation fitted if the window changes under it.
  useEffect(() => {
    if (!open || !artboard) return;
    const refit = () => setZoom(fitScale(artboard, maxCardWidth));
    window.addEventListener("resize", refit);
    return () => window.removeEventListener("resize", refit);
  }, [open, artboard, maxCardWidth]);

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;

    // Lock the page, and pay back the scrollbar's width as padding — dropping
    // it would reflow the whole document a few pixels wider underneath the
    // scrim, which you'd see the moment the lightbox closed.
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      // Back to the tile you opened, not the top of the document.
      trigger?.focus({ preventScroll: true });
    };
  }, [open, close]);

  return (
    <>
      {/* A div carrying the button role, not a real `<button>`. Two of the
          coded animations rebuild product UI that contains its own `<button>`,
          and a button inside a button is nesting the HTML parser refuses: it
          closes the outer one, so the server markup and the client tree
          disagree and hydration fails. Enter and Space are wired by hand
          below to buy back what the native element would have given. */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={openZoom}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault(); // Space would otherwise scroll the page.
          openZoom();
        }}
        aria-label={`Enlarge ${
          isComponent ? "animation" : isVideo ? "video" : "image"
        }: ${label}`}
        className={[
          "block h-full w-full cursor-zoom-in",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/25",
          // The framed variants float their media on the stage; a bare image
          // runs to the tile's own padding, and an animation brings its own.
          isVideo || item.frame
            ? "flex items-center justify-center p-4 sm:p-8"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isComponent ? (
          <TileAnimation name={item.component} />
        ) : isVideo ? (
          <motion.div
            layoutId={shared}
            transition={MORPH}
            className={`overflow-hidden rounded-lg ${VIDEO_SHADOW}`}
            style={{ aspectRatio: aspect, maxWidth: "100%", maxHeight: "100%" }}
          >
            <video
              ref={thumbVideo}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={item.poster}
              aria-label={item.alt ?? item.caption}
            >
              <source src={item.src} type="video/mp4" />
            </video>
          </motion.div>
        ) : item.frame ? (
          <motion.img
            layoutId={shared}
            transition={MORPH}
            src={item.src}
            alt={item.alt ?? ""}
            loading="lazy"
            decoding="async"
            className={`max-h-full max-w-full rounded-lg border border-border object-contain ${TILE_SHADOW}`}
          />
        ) : (
          <motion.img
            layoutId={shared}
            transition={MORPH}
            src={item.src}
            alt={item.alt ?? ""}
            loading="lazy"
            decoding="async"
            className={`h-full w-full p-4 sm:p-6 ${
              item.fit === "cover" ? "object-cover" : "object-contain"
            }`}
          />
        )}
      </div>

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <div
                  // AnimatePresence tracks its children by key, and an unkeyed
                  // child never completes its exit — the overlay would stay in
                  // the DOM after closing, invisible but still covering the
                  // page and swallowing every click.
                  key="lightbox"
                  role="dialog"
                  aria-modal="true"
                  aria-label={label}
                  className="fixed inset-0 z-[80]"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={FADE}
                    onClick={close}
                    className="absolute inset-0 cursor-zoom-out bg-scrim backdrop-blur-[3px]"
                  />

                  {/* Transparent to clicks, so anything that isn't the media
                      falls through to the scrim and closes. */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-10">
                    {isComponent ? (
                      /* No shared layout for these. The tile's copy and this
                         one are two live instances of the same loop running out
                         of phase, so a morph would cross-fade two different
                         frames of the animation into each other. They get the
                         house pop-in instead — and a fresh mount here means the
                         sequence replays from its first step, which is what you
                         wanted when you opened it. */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={MORPH}
                        onClick={close}
                        className="pointer-events-auto cursor-zoom-out"
                        style={
                          artboard
                            ? { width: artboard.w * zoom, height: artboard.h * zoom }
                            : undefined
                        }
                      >
                        {/* The scale is the zoom. The inner box stays at the
                            artboard's own pixel size so the animation lays out
                            exactly as it does in the tile — same breakpoints,
                            same wrapping — and only the finished result is
                            magnified. */}
                        <div
                          style={
                            artboard
                              ? {
                                  width: artboard.w,
                                  height: artboard.h,
                                  transform: `scale(${zoom})`,
                                  transformOrigin: "top left",
                                }
                              : undefined
                          }
                        >
                          {/* `immediate`: this copy mounts on the click, so it
                              must not open on the sequence's out-frame. */}
                          <TileAnimation name={item.component} immediate />
                        </div>
                      </motion.div>
                    ) : isVideo ? (
                      <motion.div
                        layoutId={shared}
                        transition={MORPH}
                        initial={reduce ? { opacity: 0 } : undefined}
                        animate={reduce ? { opacity: 1 } : undefined}
                        exit={reduce ? { opacity: 0 } : undefined}
                        onClick={close}
                        className={`pointer-events-auto w-full overflow-hidden rounded-xl ${
                          withSound ? "" : "cursor-zoom-out"
                        }`}
                        style={{
                          aspectRatio: aspect,
                          maxWidth: "min(84rem, 100%)",
                          maxHeight: "100%",
                          boxShadow: PANEL_SHADOW,
                        }}
                      >
                        <video
                          ref={zoomVideo}
                          className="h-full w-full object-cover"
                          /* The click that opened this granted user
                             activation, so an unmuted autoplay is allowed
                             here — and `controls` is the fallback for the
                             cases where a browser still declines. */
                          autoPlay
                          muted={!withSound}
                          loop={!withSound}
                          controls={withSound}
                          playsInline
                          preload="auto"
                          poster={item.poster}
                          aria-label={item.alt ?? item.caption}
                          /* The wrapper closes the lightbox on click, which
                             would make the play button and the scrubber
                             unusable. Clicks on the player stop here; the
                             scrim around it still closes. */
                          onClick={
                            withSound ? (e) => e.stopPropagation() : undefined
                          }
                        >
                          <source src={item.src} type="video/mp4" />
                        </video>
                      </motion.div>
                    ) : (
                      <motion.img
                        layoutId={shared}
                        transition={MORPH}
                        initial={reduce ? { opacity: 0 } : undefined}
                        animate={reduce ? { opacity: 1 } : undefined}
                        exit={reduce ? { opacity: 0 } : undefined}
                        onClick={close}
                        src={item.src}
                        alt={item.alt ?? ""}
                        decoding="async"
                        className="pointer-events-auto max-h-full max-w-[min(84rem,100%)] cursor-zoom-out rounded-xl object-contain"
                        style={{ boxShadow: PANEL_SHADOW }}
                      />
                    )}
                  </div>

                  <motion.button
                    ref={closeRef}
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={FADE}
                    // Light glyph in both themes: the scrim is dark either way.
                    // 75%, not the quieter 60% a resting control would normally
                    // get here — over the light theme's mid-grey scrim that
                    // lands at 2.5:1, under the 3:1 an icon-only control needs.
                    className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-[#ededed]/75 transition-colors duration-150 ease-out-strong hover:bg-white/10 hover:text-[#ededed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ededed]/40 sm:right-5 sm:top-5"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
