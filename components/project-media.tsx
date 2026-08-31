import type { CSSProperties } from "react";
import { MediaZoom } from "@/components/media-zoom";
import type { MediaItem } from "@/lib/projects";

/**
 * One piece of media on its stage, with its caption under it.
 *
 * The tile lives here rather than inside either of its callers because there
 * are two: the gallery below, and the figures a story places between its own
 * blocks (see components/project-story). A screenshot has to read the same
 * either way, so both go through this.
 *
 * Every tile opens into a lightbox on click, and the media itself lives in
 * MediaZoom rather than here. Screenshots and videos need to be one
 * shared-layout pair with their enlarged copy — split across a server and a
 * client component they'd be two unrelated elements and the tile would pop
 * rather than grow — and the coded animations need their artboard measured off
 * the live tile before they can be scaled up.
 */
export function MediaFigure({ item }: { item: MediaItem }) {
  /* The stage's ratio, as two custom properties rather than one inline
     `aspectRatio`, because it can change at `sm` (see MediaItem.stage). An
     inline style can't hold a breakpoint, and a class can't hold a value from
     the data — so the data goes in as variables and the breakpoint stays in the
     class list where every other responsive decision on this tile lives. */
  const sized = !!item.aspect && item.type !== "component";
  const ratio = sized
    ? ({
        "--stage": item.aspect,
        "--stage-wide": item.stage ?? item.aspect,
      } as CSSProperties)
    : undefined;

  return (
    <figure className="space-y-2.5">
      <div
        className={[
          "group relative overflow-hidden rounded-lg",
          // Coded animations size to their content — a centred card.
          // A fixed aspect ratio left the stage far taller than the card
          // (an exaggerated neutral band); extra vertical padding here
          // gives the card breathing room without that exaggeration.
          // Anything that states its own ratio gets it; the rest keep the
          // framed square → 16/9 default.
          item.type === "component"
            ? "py-8 sm:py-12"
            : sized
              ? // `md`, not `sm`. The wide stage and the tile's padding both
                // used to change at `sm`, and between 560px and 640px the two
                // together made the screenshot 12% *smaller* as the viewport
                // grew. The inset is a wide-layout luxury either way, so it
                // waits for the wide layout.
                "aspect-[var(--stage)] md:aspect-[var(--stage-wide)]"
              : "aspect-square sm:aspect-video",
          item.type === "image" && !item.frame
            ? ""
            : "bg-foreground/[0.04] transition-colors duration-200 hover:bg-foreground/[0.06]",
        ]
          .filter(Boolean)
          .join(" ")}
        style={ratio}
      >
        <MediaZoom item={item} />
      </div>
      {item.caption ? (
        <figcaption className="mx-auto max-w-xl text-center text-sm font-medium leading-relaxed text-muted">
          {item.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * The media shown at the end of a case study. Each item sits on a neutral,
 * rounded stage (alphagrill-style) that darkens on hover; content is contained
 * and centered on it. Full-width by default, `span: "half"` pairs 2-up.
 * Renders nothing when a project has no media — which includes every case that
 * places its figures inline instead.
 */
export function ProjectMedia({ media }: { media?: MediaItem[] }) {
  if (!media || media.length === 0) return null;

  return (
    // Wider than the reading column so the media reads bigger than the copy.
    // Sized off the shell rather than the viewport: the assistant rail takes
    // real width away, and 100vw would push the gallery under it.
    <div className="mx-auto w-full max-w-[64rem]">
      <ul className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        {media.map((item, i) => (
          <li
            key={`${item.src ?? item.component}-${i}`}
            className={item.span === "half" ? "" : "sm:col-span-2"}
          >
            <MediaFigure item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
