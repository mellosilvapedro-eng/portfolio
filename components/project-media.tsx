import type { ComponentType } from "react";
import { CodeVerification } from "@/components/animations/code-verification";
import { DeviceControl } from "@/components/animations/device-control";
import { DeviceLastSwitch } from "@/components/animations/device-lastswitch";
import { JusiaPaywall } from "@/components/animations/jusia-paywall";
import { SegmentedToggle } from "@/components/animations/segmented-toggle";
import type { MediaItem } from "@/lib/projects";

/** Coded animations, keyed by MediaItem.component. */
const ANIMATIONS: Record<string, ComponentType> = {
  "jusia-paywall": JusiaPaywall,
  "device-control": DeviceControl,
  "code-verification": CodeVerification,
  "device-lastswitch": DeviceLastSwitch,
  "segmented-toggle": SegmentedToggle,
};

/**
 * The media shown at the end of a case study. Each item sits on a neutral,
 * rounded stage (alphagrill-style) that darkens on hover; content is contained
 * and centered on it. Full-width by default, `span: "half"` pairs 2-up.
 * Renders nothing when a project has no media.
 */
export function ProjectMedia({ media }: { media?: MediaItem[] }) {
  if (!media || media.length === 0) return null;

  return (
    // Break out of the max-w-2xl text column so the media reads bigger than the
    // copy. Centred on the viewport, capped at 64rem, with a gutter so it never
    // triggers horizontal scroll.
    <div className="relative left-1/2 w-[min(64rem,100vw-3rem)] -translate-x-1/2">
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

function MediaTile({ item }: { item: MediaItem }) {
  if (item.type === "component") {
    const Animation = item.component ? ANIMATIONS[item.component] : undefined;
    return Animation ? <Animation /> : null;
  }

  const fitClass = item.fit === "cover" ? "object-cover" : "object-contain";

  if (item.type === "image" && item.frame) {
    // A screenshot floating on the neutral stage, like the video: centred and
    // contained, with a hairline border + shadow so its white edges read
    // cleanly against the stage. Static — no motion.
    return (
      <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- static /public asset; matches the site's existing <img> convention (no next/image) */}
        <img
          src={item.src}
          alt={item.alt ?? ""}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full rounded-lg border border-border object-contain shadow-[0_18px_44px_-16px_rgba(0,0,0,0.28)]"
        />
      </div>
    );
  }

  if (item.type === "video") {
    // A rounded screen floating on the neutral stage (alphagrill-style). The
    // wrapper takes the video's own aspect ratio so object-cover never crops,
    // and rounds + shadows the content to match the other cards.
    return (
      <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
        <div
          className="overflow-hidden rounded-lg shadow-[0_18px_44px_-16px_rgba(0,0,0,0.28)]"
          style={{
            aspectRatio: item.aspect ?? "16 / 9",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          <video
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
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static /public asset; matches the site's existing <img> convention (no next/image)
    <img
      src={item.src}
      alt={item.alt ?? ""}
      loading="lazy"
      decoding="async"
      className={`h-full w-full p-4 sm:p-6 ${fitClass}`}
    />
  );
}
