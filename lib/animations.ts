import type { ComponentType } from "react";
import { CodeVerification } from "@/components/animations/code-verification";
import { DeviceControl } from "@/components/animations/device-control";
import { DeviceLastSwitch } from "@/components/animations/device-lastswitch";
import { JusiaPaywall } from "@/components/animations/jusia-paywall";
import { SegmentedToggle } from "@/components/animations/segmented-toggle";

/**
 * Coded animations, keyed by MediaItem.component.
 *
 * Shared, because two places now resolve the same key: the gallery at the end
 * of a case study (components/project-media) and the hover preview on the home
 * list (components/case-preview). A second copy of this map would go stale the
 * first time an animation is added and only one list hears about it.
 */
export const ANIMATIONS: Record<string, ComponentType> = {
  "jusia-paywall": JusiaPaywall,
  "device-control": DeviceControl,
  "code-verification": CodeVerification,
  "device-lastswitch": DeviceLastSwitch,
  "segmented-toggle": SegmentedToggle,
};
