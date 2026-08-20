"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AskButton } from "@/components/ask-button";
import { useChat } from "@/components/chat-provider";
import { ChipButton } from "@/components/chip-button";
import { SITE_LINKS, type NavItem } from "@/lib/nav";

/* The universal menu: one floating bar, the same on every page.

   The pill is the site's navigation — Work / Skills / Projects, the current one
   lit. It used to be section links instead, a different set per page, which made
   it a control that changed meaning as you moved; it now says the same thing
   everywhere, and a case study just adds ← beside it to get back to the timeline
   it came from.

   The pill holds routes and nothing else. The assistant used to sit in there
   with them, which framed it as a fourth place to go; it now stands beside the
   pill as its own button (components/ask-button). It drops out entirely while
   the assistant is open — it's already answering.

   The theme control used to end this row; it has moved to the corner of the
   window (components/site-shell), which is why the bar is just routes and the
   assistant now. */

export function SiteNav({
  items,
  back,
}: {
  items: NavItem[];
  /** Route the leading ← button goes to. Omitted on top-level pages. */
  back?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { open } = useChat();
  /* Predicate rather than a plain truthiness filter, so the pill can read
     `item.href` without asserting it. */
  const links = items.filter(
    (item): item is NavItem & { href: string } => !!item.href,
  );
  const ask = items.find((item) => item.ask);

  return (
    <div
      className={`fixed inset-x-0 bottom-6 z-40 flex justify-center gap-[11px] px-4 transition-[right] duration-500 ease-drawer ${
        open ? "lg:right-96 max-lg:hidden" : ""
      }`}
    >
      {/* ← and the pill and the assistant come to 335px, which is more row than
          a 320px phone has. The chip is the one to give up there: `back` points
          at "/" on every page that sets it, and so does the pill's Work tab, so
          below 360px the redundant control steps out rather than the bar
          clipping at both ends. Guarded on there being a pill at all — on 404,
          where the chip is the only way out, it stays at every width. */}
      {back ? (
        <ChipButton
          label="Back"
          onClick={() => router.push(back)}
          className={links.length > 0 ? "max-[359px]:hidden" : ""}
        >
          <BackIcon />
        </ChipButton>
      ) : null}

      {links.length > 0 ? (
        <nav
          aria-label="Main"
          className="nav-surface flex h-12 items-center gap-1 rounded-full px-1.5"
        >
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

      {/* Last on purpose: it's the one thing here that grows, so it opens
          rightward into empty space rather than over a chip. */}
      {ask && !open ? (
        <AskButton
          label={ask.label}
          prompt={typeof ask.ask === "string" ? ask.ask : undefined}
        />
      ) : null}
    </div>
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

/* Exported from the design's back chip. Path data is Figma's, with the baked
   #7D7D7D swapped for currentColor so the chip drives it. */
function BackIcon() {
  return (
    <svg
      width="11"
      height="9"
      viewBox="0 0 10.2315 8.90909"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.45455 8.90909L0 4.45455L4.45455 0L5.22017 0.755682L2.06818 3.90767H10.2315V5.00142H2.06818L5.22017 8.14347L4.45455 8.90909Z"
        fill="currentColor"
      />
    </svg>
  );
}

