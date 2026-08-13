import { LogoMark } from "@/components/logo-mark";

/* ────────────────────────────────────────────────────────────────────────
   The opening — the mark assembles on the page's own ground, then hands over to
   the content.

   It's an arrival, so it's gated to arrivals: the first time in a session that
   someone lands on `/` as a fresh page load. Not on other routes, not on a
   refresh, and not when the Back chip pushes home from a project page. It costs
   two seconds, and two seconds is only worth spending on a greeting — a visitor
   who has already been greeted just wants the page.

   Three conditions, and none of them can be done in CSS, but only one needs
   script. See `ENTRY` below for how each is enforced.

   The interesting one is *entry only*. Route-scoped placement alone gives the
   wrong answer for navigation: React re-renders this page when you push to `/`,
   the cover markup gets inserted, and its CSS animations start from zero.
   Nothing in a stylesheet can tell "the document was just parsed" from "a
   subtree was just mounted". The script can, by not running — browsers don't
   execute scripts that arrive by DOM insertion, so it fires during the initial
   HTML parse and never again for the life of the document.

   React dev builds warn about this ("Encountered a script tag while rendering
   React component… never executed when rendering on the client"). That warning
   is describing the mechanism, not a bug: it's the guarantee this gate is built
   on, and it's absent from production builds. Don't take the suggestion — a
   `<template>` executes nothing at all, and the forms that do run on the client
   (`next/script`, an external `src`) would replay the opening on every
   navigation back to home.

   Everything after the attribute is CSS, which is what lets the cover animate
   from the first painted frame with no hydration to wait for. And the script
   sits before the markup it gates so the cover is never laid out un-stamped: it
   would otherwise flip from `display: none` to `display: grid` a frame later and
   restart its own clock.

   The timeline, all of it in globals.css and components/logo-mark:

     0ms        the cover is already there — it's the first paint, same colour as
                the shell, so there's nothing to fade in
     0–720ms    the mark fades up. Opacity only, on `ease`, and slow enough to
                actually see: it's the logo arriving, and a scale or a blur on
                top would be the splash having an opinion about a mark that just
                needs to be legible
     0ms on     two diagonal fronts cross the lattice on a loop, left to right and
                down, their edges scattered into pixels — cells lighting and going
                out, lighting and going out. The loader's wave on the real mark
     720–1600   the mark, exposed, with the wave playing over it. Long enough for
                the cells to fall out of phase and the field to get properly
                irregular, which is the thing worth watching
     1440ms     content starts rising underneath, finishing its own stagger by
                2240ms — before the cover's clock runs out, which is what lets the
                gate clear its attribute without re-timing a running animation
     1600–2020  the mark fades out, again opacity only
     2000ms     the cover begins to leave, and stops taking clicks
     2320ms     gone, out of the a11y tree, and the attribute with it

   The mark is gone before the cover lifts, so those read as two beats: the mark
   leaves, then the ground does. Content and cover overlap on purpose, though —
   that pair wants to read as one moment, not as a handoff.
   ──────────────────────────────────────────────────────────────────────── */

/** The gate. Three conditions, each enforced by a different mechanism, and it
    takes all three to mean "someone just arrived at the site":

      home only     — this component is in `app/page.tsx`, so the script only
                      exists in `/`'s HTML
      entry only    — a script that arrives by DOM insertion doesn't execute, so
                      pushing to `/` from a project page can't fire it
      once per visit — the flag, so a refresh doesn't replay it either

    `sessionStorage`, not `localStorage`: a reload shouldn't repeat the opening,
    but coming back tomorrow should still get one. Swap it to show the opening
    exactly once per browser, ever.

    If storage throws — private windows, storage disabled — the splash is skipped
    rather than replayed. Never seeing it is a smaller cost than seeing it on
    every single load, which is the thing this gate exists to prevent.

    Then it cleans up after itself, and that half is not optional. The attribute
    means "the opening is running right now", so it has to stop existing when the
    opening stops — otherwise it sits on <html> for the life of the document and
    every internal navigation inherits `--splash-hold` from it. Leaving it set is
    what made /skills open blank for two seconds after a visit to home: a real
    2s delay on a page with no cover to wait for.

    `animationend` on the cover is the exact moment, and it beats a timer for
    honesty — no duration to keep in sync with the stylesheet, and reduced motion
    (which runs the same cover on a much shorter clock) gets the right answer for
    free. `splash-out` only ever belongs to the cover, but the listener is on the
    window because the cover doesn't exist yet when this runs. */
const ENTRY = `(function(){
var r=document.documentElement;
try{
if(sessionStorage.getItem("pm-splash"))return;
sessionStorage.setItem("pm-splash","1");
}catch(e){return}
r.dataset.splash="play";
addEventListener("animationend",function done(e){
if(e.animationName!=="splash-out")return;
removeEventListener("animationend",done);
delete r.dataset.splash;
});
})();`;

export function SplashScreen() {
  return (
    <>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: ENTRY }}
      />

      {/* Decorative throughout — and `aria-hidden` rather than a `role="status"`
          loading announcement on purpose. Nothing is being waited for here; the
          page behind this is already complete. Announcing it as progress would be
          a promise the site isn't making, and the mark carries no information the
          header doesn't repeat a second later anyway. */}
      <div className="splash" aria-hidden="true">
        {/* 112px, from the design. `size-28` is exactly that. */}
        <span className="splash-mark size-28 text-foreground">
          <LogoMark className="size-full" />
        </span>
      </div>
    </>
  );
}
