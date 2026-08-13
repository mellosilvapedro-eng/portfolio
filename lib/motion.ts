/* Smooth scrolling, stated per call.

   It used to be one line of CSS on <html>, which was tidier but also applied
   to the router's scroll reset on every navigation — see the note at the top of
   app/globals.css for why that had to go. The cost of moving it here is that
   `prefers-reduced-motion` no longer comes for free from a media query, so it
   gets checked in JS instead. */

/** Read at call time, never cached: someone can turn the OS setting on while
    the tab is open, and the next scroll should already respect it. */
export function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}
