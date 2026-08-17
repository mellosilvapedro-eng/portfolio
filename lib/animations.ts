import type { ComponentType } from "react";
import { CodeVerification } from "@/components/animations/code-verification";
import { DeviceControl } from "@/components/animations/device-control";
import { DeviceLastSwitch } from "@/components/animations/device-lastswitch";
import { JusiaPaywall } from "@/components/animations/jusia-paywall";
import { SegmentedToggle } from "@/components/animations/segmented-toggle";

export type AnimationProps = {
  /**
   * Open on the first visible step instead of the sequence's leading
   * out-frame. Off for a tile, which has been looping since page load and
   * reads that frame as an entrance; on for a copy mounted by a click, where
   * the same frame is several hundred milliseconds of nothing happening.
   * Animations that already open visible ignore it.
   */
  immediate?: boolean;
};

/**
 * Coded animations, keyed by MediaItem.component.
 *
 * Shared, because two places now resolve the same key: the gallery at the end
 * of a case study (components/project-media) and the hover preview on the home
 * list (components/case-preview). A second copy of this map would go stale the
 * first time an animation is added and only one list hears about it.
 */
export const ANIMATIONS: Record<string, ComponentType<AnimationProps>> = {
  "jusia-paywall": JusiaPaywall,
  "device-control": DeviceControl,
  "code-verification": CodeVerification,
  "device-lastswitch": DeviceLastSwitch,
  "segmented-toggle": SegmentedToggle,
};

/**
 * How wide a card may end up on screen when enlarged, in CSS pixels.
 *
 * A default gets most of them right, but not all: these are five different
 * product screens, not one design system, and how big a card wants to be
 * depends on what's inside it rather than on its width. A dense list of
 * sessions carries magnification that a sparse screen — one illustration, one
 * headline, one full-width button — turns into a poster at the same measure.
 * So the ceiling is per animation, and this is the one number to nudge.
 */
export const ZOOM_MAX_WIDTH: Record<string, number> = {
  "device-lastswitch": 560,
};

/** Applied to any animation without an entry above. */
export const DEFAULT_ZOOM_MAX_WIDTH = 700;
