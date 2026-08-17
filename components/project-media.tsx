import { MediaZoom } from "@/components/media-zoom";
import type { MediaItem } from "@/lib/projects";

/**
 * The media shown at the end of a case study. Each item sits on a neutral,
 * rounded stage (alphagrill-style) that darkens on hover; content is contained
 * and centered on it. Full-width by default, `span: "half"` pairs 2-up.
 * Renders nothing when a project has no media.
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
            <figure className="space-y-2.5">
              <div
                className={[
                  "group relative overflow-hidden rounded-lg",
                  // Coded animations size to their content — a centred card.
                  // A fixed aspect ratio left the stage far taller than the card
                  // (an exaggerated neutral band); extra vertical padding here
                  // gives the card breathing room without that exaggeration.
                  // Images/videos keep the framed square → 16/9 ratio.
                  item.type === "component"
                    ? "py-8 sm:py-12"
                    : "aspect-square sm:aspect-video",
                  item.type === "image" && !item.frame
                    ? ""
                    : "bg-foreground/[0.04] transition-colors duration-200 hover:bg-foreground/[0.06]",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  item.aspect && item.type !== "component"
                    ? { aspectRatio: item.aspect }
                    : undefined
                }
              >
                <MediaTile item={item} />
              </div>
              {item.caption ? (
                <figcaption className="mx-auto max-w-xl text-center text-sm font-medium leading-relaxed text-muted">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          </li>
          ))}
        </ul>
      </div>
  );
}

// Every tile opens into a lightbox on click, so the media itself lives in
// MediaZoom rather than here. Screenshots and videos need to be one
// shared-layout pair with their enlarged copy — split across a server and a
// client component they'd be two unrelated elements and the tile would pop
// rather than grow — and the coded animations need their artboard measured off
// the live tile before they can be scaled up.
function MediaTile({ item }: { item: MediaItem }) {
  return <MediaZoom item={item} />;
}
