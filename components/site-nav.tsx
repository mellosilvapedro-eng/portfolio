"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AskButton } from "@/components/ask-button";
import { useChat } from "@/components/chat-provider";
import { ChipButton } from "@/components/chip-button";
import { scrollBehavior } from "@/lib/motion";

/* The universal menu: one floating bar that follows the page it's on.
   Home gets About / Work; a case study swaps in a back button and Screens.

   The pill holds section links and nothing else. The assistant used to sit in
   there with them, which framed it as a third place to scroll to; it now stands
   beside the pill as its own button (components/ask-button). It drops out
   entirely while the assistant is open — it's already answering.

   The theme control used to end this row; it has moved to the corner of the
   window (components/site-shell), which is why the bar is just sections and the
   assistant now. */

export type NavItem = {
  label: string;
  /** id of the section this item scrolls to. */
  target?: string;
  /** Opens the assistant. A string is sent as the opening prompt. Items marked
      this way leave the pill and become the trailing assistant button — their
      `label` is the copy it opens to say, so it changes with what the page can
      be asked about. */
  ask?: string | true;
};

export function SiteNav({
  items,
  back,
}: {
  items: NavItem[];
  /** Route the leading ← button goes to. Omitted on top-level pages. */
  back?: string;
}) {
  const router = useRouter();
  const { open } = useChat();
  const links = items.filter((item) => !item.ask);
  const ask = items.find((item) => item.ask);
  const active = useScrollSpy(links.map((i) => i.target));

  return (
    <div
      className={`fixed inset-x-0 bottom-6 z-40 flex justify-center gap-[11px] px-4 transition-[right] duration-500 ease-drawer ${
        open ? "lg:right-96 max-lg:hidden" : ""
      }`}
    >
      {back ? (
        <ChipButton label="Back" onClick={() => router.push(back)}>
          <BackIcon />
        </ChipButton>
      ) : null}

      {links.length > 0 ? (
        <nav
          aria-label="Page sections"
          className="nav-surface flex h-11 items-center gap-1 rounded-full px-1.5"
        >
          {links.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.target && scrollToSection(item.target)}
              aria-current={
                item.target && item.target === active ? "true" : undefined
              }
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] font-medium leading-[21px] transition-[color,background-color,transform] duration-150 ease-out-strong active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25 ${
                item.target && item.target === active
                  ? "bg-[var(--nav-active)] text-[var(--nav-fg)]"
                  : "text-[var(--nav-muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--nav-fg)]"
              }`}
            >
              {item.label}
            </button>
          ))}
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

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

/**
 * Marks the section the reader is currently in. Reads geometry on scroll rather
 * than using IntersectionObserver: the sections are page-length, so what
 * matters is which one has passed the reading line, not which is intersecting.
 */
function useScrollSpy(ids: (string | undefined)[]) {
  const [active, setActive] = useState<string>();
  const key = ids.join("|");

  useEffect(() => {
    const targets = key.split("|").filter(Boolean);
    if (targets.length === 0) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current = targets[0];
      for (const id of targets) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }

      /* The last section usually can't reach the reading line: it sits near the
         end of the document, so the page runs out of scroll while it's still
         below the mark. Home's Experiments stops at ~358px on an 800px-tall
         window — its own nav item would never light, which reads as a broken
         control rather than as a page that's simply short.
         At the bottom of the document the answer isn't in doubt anyway: the
         last section is the one you're looking at. Guarded on the page actually
         scrolling, so a page that fits the window doesn't mark its final
         section active from the start. */
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (
        scrollable > 0 &&
        window.scrollY >= scrollable - 2 // fractional zoom / DPR slack
      ) {
        current = targets[targets.length - 1];
      }

      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [key]);

  return active;
}
