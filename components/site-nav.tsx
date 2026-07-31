"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/components/chat-provider";
import { ChipButton } from "@/components/chip-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { askPedro } from "@/lib/ask";

/* The universal menu: one floating bar that follows the page it's on.
   Home gets About / Work / Ask me anything; a case study swaps in a back
   button, Screens, and a project-scoped ask. The ask item drops out while the
   assistant is open — it's already answering. */

export type NavItem = {
  label: string;
  /** id of the section this item scrolls to. */
  target?: string;
  /** Opens the assistant. A string is sent as the opening prompt. */
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
  const { open, setOpen } = useChat();
  const active = useScrollSpy(items.map((i) => i.target));

  const visible = items.filter((item) => !(open && item.ask));

  return (
    <div
      className={`fixed inset-x-0 bottom-6 z-40 flex justify-center gap-2.5 px-4 transition-[right] duration-500 ease-drawer ${
        open ? "lg:right-96 max-lg:hidden" : ""
      }`}
    >
      {back ? (
        <ChipButton label="Back" onClick={() => router.push(back)}>
          <BackIcon />
        </ChipButton>
      ) : null}

      <nav
        aria-label="Page sections"
        className="nav-surface flex h-10 items-center gap-1 rounded-full px-1.5 py-1"
      >
        {visible.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              if (item.ask) {
                if (typeof item.ask === "string") askPedro(item.ask);
                else setOpen(true);
                return;
              }
              if (item.target) scrollToSection(item.target);
            }}
            aria-current={
              item.target && item.target === active ? "true" : undefined
            }
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium leading-[19.5px] transition-[color,background-color,transform] duration-150 ease-out-strong active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25 sm:px-4 ${
              item.ask
                ? // The assistant is the one action in the bar: it carries the
                  // gradient edge, and its label sits at full ink rather than
                  // the muted grey the section links use.
                  "gradient-border text-[var(--nav-fg)]"
                : item.target && item.target === active
                  ? "bg-[var(--nav-active)] text-[var(--nav-fg)]"
                  : "text-[var(--nav-muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--nav-fg)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <ThemeToggle />
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
  el.scrollIntoView({ behavior: "smooth", block: "start" });
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
