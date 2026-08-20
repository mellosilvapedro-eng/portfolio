"use client";

import { useChat } from "@/components/chat-provider";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The page content, as a card floating over the assistant rail.
 *
 * When the chat opens on a docked viewport the shell gives up 24rem on the
 * right — it doesn't get covered — so the rail is revealed rather than
 * overlaid. Undocked, the rail becomes a sheet on top and the shell stays put.
 *
 * The shell's *surface* is a fixed layer, separate from the scrolling content.
 * That's what keeps its rounded right edge pinned to the top and bottom of the
 * viewport at every scroll position — which is the whole point of the corner:
 * it's what tells you the content is a card on top of something. Rounding the
 * scrolling block instead would round the top and bottom of the *document*, so
 * the corner would be gone one screen down.
 *
 * Deliberately not a `@container`: inline-size containment would make this the
 * containing block for the fixed nav inside it. Pages that need to measure the
 * shell open their own container further in.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const { open } = useChat();

  return (
    <>
      {/* The painted surface. Sits at z-0 like the rail but after it in source
          order, so when the chat is closed it simply covers the rail.
          `sm` on the elevation ladder — the rail is one step below the shell,
          not a popover above the page. The design only darkens the seam from
          #151515 to #131313, so the shadow seats the edge and nothing more. */}
      {/* `border-radius` is deliberately not in the transition list: animating
          it promotes this to a composited layer and Chrome then fails to
          repaint the small bottom corner, leaving the edge square below the
          fold. It snaps instead, which is invisible under a 500ms slide. */}
      <div
        aria-hidden="true"
        className={`fixed inset-y-0 left-0 z-0 bg-background transition-[right,box-shadow] duration-500 ease-drawer ${
          open
            ? "right-0 lg:right-96 lg:rounded-r-2xl lg:shadow-[1px_0_2px_rgba(17,17,24,0.05),2px_0_8px_rgba(17,17,24,0.07)] lg:dark:shadow-[2px_0_8px_rgba(0,0,0,0.4)]"
            : "right-0"
        }`}
      />

      <div
        className={`relative z-10 min-h-dvh transition-[margin-right] duration-500 ease-drawer ${
          open ? "lg:mr-96" : ""
        }`}
      >
        {children}

        {/* Out of focus behind a case preview. A window-level layer, like the
            two fades and the toggle — it belongs to the frame rather than to the
            list that triggers it, and it has to be here for a mechanical reason
            as well: `fixed` inside the page would resolve against whichever
            section it sat in, covering that section instead of the window.

            z-20, the same rung as the fades, which puts it over everything in
            the page's own flow and under the card (z-30), the toggle (z-30) and
            the bar (z-40). Tracks the shell's right edge for the same reason the
            fades do. Its own opacity and blur are in globals.css, keyed off the
            open preview with `:has()` — nothing about it is wired through here,
            so pages that have no previews pay for one idle layer and no JS. */}
        <div
          aria-hidden="true"
          className={`preview-scrim pointer-events-none fixed inset-y-0 left-0 z-20 ${
            open ? "right-0 lg:right-96 lg:rounded-r-2xl" : "right-0"
          }`}
        />

        {/* Both edges get the same treatment, for the same reason: each one has a
            control pinned to it, and text arriving underneath has to go somewhere.
            Both sit at z-20, under the toggle's z-30 and the bar's z-40, and both
            use the same ramp pointed opposite ways (see globals.css).

            The heights differ because the two controls do. The bar carries its own
            blurred surface, so 48px is only ever softening an approach. The toggle
            is a bare 16.5px glyph with nothing behind it, so its fade has to
            actually clear the ground — and since the ramp is only ~50% dense at
            half its height, a 48px fade left the copy behind the glyph peaking
            brighter than the glyph itself (131 vs ~125 in dark). At 80px that drops
            to 70 and the icon wins its own corner. Past ~96px it stops paying for
            the page it hides.

            Both have to be *inside* this wrapper, not siblings of it. The wrapper
            is `relative z-10`, which makes it a stacking context, and the bar
            lives inside it — so the bar's z-40 is sealed in here and counts as 10
            out in the root context. A fade sibling at z-20 therefore painted over
            the bar no matter how high the bar's own z-index went (it washed the
            pill's lower edge at ~33% of --background, dimming the label glyphs
            from 255 to 232). Rendered as siblings of {children} instead, the fades
            and the bar share one stacking context and 20 < 40 finally means what
            it reads like.

            `fixed` still resolves against the viewport in here: the wrapper only
            transitions margin, and margin isn't one of the properties that forms
            a containing block for fixed descendants. That's also why each right
            edge is tracked explicitly rather than inherited from `lg:mr-96` —
            they stop at the shell's seam instead of washing over the rail. */}
        <div
          aria-hidden="true"
          className={`top-fade pointer-events-none fixed left-0 top-0 z-20 h-20 transition-[right] duration-500 ease-drawer ${
            open ? "right-0 lg:right-96 lg:rounded-tr-2xl" : "right-0"
          }`}
        />

        {/* Day / night, in the corner of the window. A direct child of the frame
            in the design rather than part of any column — so it lives here, once,
            and every page gets the same control in the same place.
            `top-2 right-2` puts the 32px hit area where its 16.5px glyph lands on
            the design's 15px / 16.5px insets. When the assistant docks it steps
            in to the shell's new edge instead of floating over the rail, and on
            viewports too narrow to dock (where the rail covers the page outright)
            it gets out of the way, same as the bar does. */}
        <ThemeToggle
          className={`fixed top-2 z-30 transition-[right] duration-500 ease-drawer ${
            open ? "right-2 lg:right-[24.5rem] max-lg:hidden" : "right-2"
          }`}
        />

        {/* The bottom edge, ramped into the ground, so copy scrolling toward the
            floating bar dissolves instead of colliding with it.

            It has to be *inside* this wrapper, not a sibling of it. The wrapper
            is `relative z-10`, which makes it a stacking context, and the nav
            lives inside it — so the nav's z-40 is sealed in here and counts as 10
            out in the root context. A fade sibling at z-20 therefore painted over
            the bar no matter how high the bar's own z-index went (it washed the
            pill's lower edge at ~33% of --background). Rendered as a sibling of
            {children} instead, the fade and the nav share one stacking context
            and 20 < 40 finally means what it reads like.

            `fixed` still resolves against the viewport in here: the wrapper only
            transitions margin, and margin isn't one of the properties that forms
            a containing block for fixed descendants. That's also why the right
            edge is tracked explicitly rather than inherited from `lg:mr-96` —
            it stops at the shell's seam instead of washing over the assistant
            rail. The ramp itself is a mask; see globals.css. */}
        <div
          aria-hidden="true"
          className={`bottom-fade pointer-events-none fixed bottom-0 left-0 z-20 h-12 transition-[right] duration-500 ease-drawer ${
            open ? "right-0 lg:right-96 lg:rounded-br-2xl" : "right-0"
          }`}
        />
      </div>
    </>
  );
}
