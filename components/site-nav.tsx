"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AskButton } from "@/components/ask-button";
import { BackButton } from "@/components/back-button";
import { useChat } from "@/components/chat-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SITE_LINKS, type NavItem } from "@/lib/nav";

/* The universal menu: one floating bar, the same on every page.

   The pill is the site's navigation — Work / Skills / Projects, the current one
   lit. It used to be section links instead, a different set per page, which made
   it a control that changed meaning as you moved; it now says the same thing
   everywhere.

   The pill holds the routes and the theme switch, and the design ends the row
   with the switch for a reason: it belongs with them. All four are small,
   instant, and finished the moment you let go — and all four keep you on the
   page you're on.

   The two that don't are the ones that left the bar, one to each top corner.
   ← used to head the row (a 48px chip that, with the pill beside it, wouldn't
   fit a 320px phone) and now sits top-left, pointing back out of the page; the
   assistant used to sit in the pill (a fourth place to go, which it isn't) and
   now sits top-right, pointing down the side the conversation opens on. This
   component still renders both — `fixed` doesn't care where in the tree it's
   written, and the `back` route and the `ask` item's copy are already here — but
   they're siblings of the bar, not part of it. */

export function SiteNav({
  items,
  back,
}: {
  items: NavItem[];
  /** Route the leading ← button goes to. Omitted on top-level pages. */
  back?: string;
}) {
  const pathname = usePathname();
  const { open } = useChat();
  /* Predicate rather than a plain truthiness filter, so the pill can read
     `item.href` without asserting it. */
  const links = items.filter(
    (item): item is NavItem & { href: string } => !!item.href,
  );
  const ask = items.find((item) => item.ask);

  return (
    <>
      {/* ← in the left corner, mirroring the assistant across the frame. It
          stays put while the chat is open on a docked viewport — the rail takes
          the right 24rem and this corner is still the shell's. Undocked it has
          to go: there the rail is a `z-50` sheet over the whole window, and a
          button left underneath it is invisible and still tabbable. Same
          `visibility` treatment as the mark opposite, so it's actually out of
          the tab order rather than just transparent, and the same timing — out
          in 100ms, back only once the sheet has finished leaving. */}
      {back ? (
        <BackButton
          href={back}
          className={`fixed left-2 top-2 z-30 transition-[opacity,visibility] ease-drawer ${
            open
              ? "max-lg:invisible max-lg:pointer-events-none max-lg:opacity-0 duration-100 delay-0"
              : "visible opacity-100 duration-300 delay-500"
          }`}
        />
      ) : null}

      {/* The assistant, in the corner of the frame — the slot the theme toggle
          used to hold. It keeps its chip and its opening label, so what lands on
          the design's spacing is the 36px it shrank to rather than the bar's 48:
          `top-2 right-2` puts the mark's centre 26px in from each edge against
          the design's 27.75 / 25.25, and leaves the surface the 8px of ground a
          control this size needs against a window edge. See components/
          ask-button for why 48 couldn't have both.

          z-30: over the page and over the top fade (z-20) that clears the ground
          under it, and below the bar (z-40). It sits inside the shell's
          `relative z-10` wrapper like the bar does, so those numbers are read
          against each other rather than against the root — see the long note in
          components/site-shell.

          It stays mounted and goes out on opacity rather than being dropped from
          the tree while the assistant is open. Unmounting looked fine going in
          and was wrong coming back, in two different ways: undocked, the rail is
          a `z-50` sheet over the whole window that takes 500ms to leave
          (components/ai-chat), so a button remounted at the top of that half
          second spends it hidden behind the sheet and then simply exists — which
          reads as the button waiting for the chat to finish before bothering to
          render. Docked, there's no sheet in the way, so the same remount pops
          it in at full strength against a shell still sliding back under it. A
          tree that isn't there can't be transitioned; one that is can be timed.

          And it has to be timed, because this corner is shared. The chat's own
          header ends with a 28px ✕ whose box lands inside this button's 36px one
          — 28×27.5 of overlap docked, 28×28 undocked, the ✕'s centre inside the
          button either way. Two controls in the same pixels is survivable while
          only one of them is on screen; it is not survivable while both are
          mid-transition. Run the two moves over one shared 500ms `ease-drawer`,
          the way the rail and the shell run, and closing the chat by its ✕ draws
          this button's mark straight through that ✕ for the whole half second —
          ✧ and ✕ superimposed, then the label sliding out from under them.

          So the moves take turns rather than landing together, and the
          asymmetry is the point. Going out is 100ms with no delay: the button
          has to clear the corner before the arriving header paints there, and
          `ease-drawer` is front-loaded enough that there *is* a header by ~80ms.
          150 was the first number tried and it left the mark at ~15% over the ✕
          for the frames either side of 80ms — visible, and visible as exactly
          the thing being fixed. 100 puts it under 5% by then.
          Coming back waits the full 500ms the chat spends leaving and then
          fades in over 300ms — the corner is empty when the mark arrives in it.

          The delay does a second job that isn't about painting. The button
          posts its label on `:hover` (components/ask-button), and closing the
          chat by its ✕ leaves the cursor parked inside this box — so the frame
          the button becomes hittable again, hover latches and it doesn't fade
          in, it fades in *already labelled*, and holds there because the cursor
          never moved. Waiting out the chat is what prevents that: `visibility`
          holds `hidden` through the delay, and a hidden element is not hit-
          tested, so there is no hover to latch until the chat is actually gone.

          `visibility` rides along in the transition for that reason and one
          more — it's the one property whose interpolation isn't symmetric. Going
          out it holds `visible` for the whole duration, so the fade is seen;
          coming back it flips at the first frame of the *active* phase, which is
          what puts it on the far side of the delay. Hidden at the end is also
          what takes the button back out of the tab order. `pointer-events` is
          deliberately *not* in the list: it should cut the moment the chat opens,
          not 100ms later. */}
      {ask ? (
        <AskButton
          label={ask.label}
          className={`fixed right-2 top-2 z-30 transition-[opacity,visibility] ease-drawer ${
            open
              ? "invisible pointer-events-none opacity-0 duration-100 delay-0"
              : "visible opacity-100 duration-300 delay-500"
          }`}
        />
      ) : null}

      <div
        className={`fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 transition-[right] duration-500 ease-drawer ${
          open ? "lg:right-96 max-lg:hidden" : ""
        }`}
      >
        {/* The surface is a plain div and the `<nav>` is the list inside it. The
            switch shares the pill but isn't navigation, and a landmark that
            promised "Main" and then held a button would be lying to anyone
            reading the page by its landmarks.

            It renders whether or not there are routes: 404 has none, and the
            theme is not a thing to lose because you mistyped a URL. With no list
            to hold, the surface collapses to a 48px circle around the switch
            instead of a squat 44px capsule. */}
        <div
          className={`nav-surface flex h-12 items-center gap-1 rounded-full ${
            links.length > 0 ? "px-1.5" : "w-12 justify-center"
          }`}
        >
          {links.length > 0 ? (
            <nav aria-label="Main" className="flex items-center gap-1">
              {links.map((item) => {
                const current = isCurrent(item.href, pathname);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-medium leading-[21px] transition-[color,background-color,transform] duration-150 ease-out-strong active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25 ${
                      current
                        ? "bg-[var(--nav-active)] text-[var(--nav-fg)]"
                        : "text-[var(--nav-muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--nav-fg)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {/* Last in the row, as the design has it. The 4px the flex gap gives
              it matches the 4.4 the design leaves between Projects and the
              icon's 30px slot. */}
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

/** Which tab is lit.
 *
 *  Every route but home claims itself and anything nested under it; home claims
 *  whatever is left. That last part is what keeps Work lit while you read a case
 *  study — cases live at the top level (/[slug]) rather than under a folder, so
 *  no prefix match can reach them, and a bar with three tabs and none of them on
 *  reads as broken. They hang off the timeline on home, so that's the tab that
 *  should be lit, and deriving it from the list means adding a fourth route
 *  can't leave this rule behind. */
function isCurrent(href: string, pathname: string) {
  const nested = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);

  if (href !== "/") return nested(href);
  return !SITE_LINKS.some(
    (link) => link.href && link.href !== "/" && nested(link.href),
  );
}
