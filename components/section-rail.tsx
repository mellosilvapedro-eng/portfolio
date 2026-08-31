"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useChat } from "@/components/chat-provider";
import { scrollBehavior } from "@/lib/motion";

/* ────────────────────────────────────────────────────────────────────────
   The case study's sections, as a rail of ticks in the left margin.

   A story case is seven sections and six figures long, and until now the only
   way to know where you were in it was to recognise the copy. This is the
   Notion table-of-contents idea: one short rule per section, the one you're
   reading drawn longer and named, and the rest of the names arriving only when
   you point at the rail. At rest it's five hairlines and a word — furniture
   quiet enough to sit beside the text without competing with it — and it grows
   into the whole outline under the cursor.

   Why ticks and not a list of links: the rail lives in the margin at every
   scroll position, so its resting state is on screen for the entire page. A
   column of seven titles there is a second navigation permanently in the corner
   of your eye. A column of rules is a position indicator, which is what this
   actually is; the titles are the detail you ask for.

   It only appears where there is genuinely margin to hold it, and `lg` was the
   wrong test for that. This is measured, not estimated: hovered, the rail runs
   from x=24 to x=173. The article is `max-w-[64rem]`, so its left edge sits at
   max(24, (vw − 1024) / 2) — and the story's figures run to that full width, not
   to the 39rem reading column. At 1280px the figures start at x=128 and the rail
   was drawing its ticks and section names straight across them; at 1024px they
   start at x=24 and it covered them completely.

   Docking makes it worse rather than better. When the assistant opens, the shell
   takes 24rem off the right (`lg:mr-96` in components/site-shell), so the article
   re-centres in what's left and its left edge snaps back toward x=24 — at 1024px
   through 1280px the rail then lands on the body copy itself.

   Vertical centring is also what keeps it clear of ← in the top-left corner
   (components/back-button, pinned `fixed left-2 top-2 z-30`). That button spans
   x 8–44 and this rail sits at x=24, so they share the gutter horizontally and
   only miss each other because this one is centred. A top-anchored variant of
   this rail would collide with it — and lose, since the button is a rung higher
   at z-30.

   So the gate is width, and it's two widths because the docked state needs 384px
   more of them. Allowing 16px of air past the rail's 173, the article's edge has
   to reach 189px: closed that needs 1024 + 2×189 ≈ 1400px, docked
   1024 + 384 + 2×189 ≈ 1790px. Hence min-[1400px] and min-[1800px]. On a 1440px
   laptop the rail is there until you open the assistant, and then it isn't —
   which is honest, because at that point the margin it lived in is gone.
   ──────────────────────────────────────────────────────────────────────── */

/** The design's two tick lengths. The active one is longer at rest; hovering
 *  the rail brings every tick up to the same length, so the column squares off
 *  as the names arrive.
 *
 *  The redesign cut both and widened the gap between them — 45→18 at rest,
 *  58.5→44 active. Worth knowing why the second number barely moved while the
 *  first fell by more than half: at 45 and 58.5 the two states were within a
 *  third of each other, so "which one is longer" was a comparison you had to
 *  make. At 18 and 44 the active tick is two and a half times its neighbours
 *  and the answer is pre-attentive. It also buys the growth back as motion —
 *  the hover now travels 26px instead of 13.5px, on a rail that takes 14px less
 *  room in the margin. */
const TICK_REST = 18;
const TICK_LONG = 44;

/** The site's `--ease-out-strong`, as an array Motion can take. */
const EASE = [0.23, 1, 0.32, 1] as const;

/** The fraction of the viewport that counts as "reading position". A heading
 *  that has crossed this line is the section you're in. A third down rather
 *  than the very top: a heading sitting at the top edge hasn't been read yet,
 *  and the section that fills the screen is the one you want named. */
const READING_LINE = 0.35;

export function SectionRail({
  sections,
}: {
  sections: { id: string; title: string }[];
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();
  const frame = useRef<number | null>(null);
  /* The assistant's docked state changes the page's geometry under this thing
     (see the note above), so the rail has to know about it — both to get out of
     the way and to re-measure, since docking reflows the page without firing a
     `resize`, which would otherwise leave the active tick pointing at whatever
     section happened to be at the reading line before the shell moved. */
  const { open: chatOpen } = useChat();

  /* Which section is being read.
   *
   * A scroll listener rather than an IntersectionObserver, deliberately. The
   * question isn't "which headings are on screen" — several are, and near the
   * end of the page none may be — it's "which heading did I last pass", which
   * is one comparison per heading and always has an answer. An observer would
   * need a band, and a band leaves gaps: scroll fast past a short section and
   * it never reports.
   *
   * Throttled to a frame: the read is cheap but `getBoundingClientRect` forces
   * layout, and doing that on every scroll event rather than every painted
   * frame is what makes a rail like this stutter.
   */
  const ids = sections.map((s) => s.id).join(",");

  useEffect(() => {
    if (sections.length === 0) return;

    const measure = () => {
      frame.current = null;

      /* At the bottom of the document, the last section wins outright.
       *
       * The reading line can't reach it: the case ends with Results, a closing
       * paragraph and the page's bottom padding — about 380px — so when the
       * document is scrolled as far as it goes, that heading is still ~520px
       * down the viewport and the line is at 315. Without this the rail spends
       * the entire last screen pointing at Iteration, which is the one section
       * you have demonstrably finished. Anything scrolled to the end is at the
       * end, whatever the arithmetic says.
       */
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        setActive(sections[sections.length - 1].id);
        return;
      }

      const line = window.innerHeight * READING_LINE;
      let current = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= line) current = section.id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    /* Keyed on the ids rather than the array, which a server render rebuilds on
       every pass, and on `chatOpen` so the reflow docking causes is measured. */
  }, [sections, ids, chatOpen]);

  if (sections.length < 2) return null;

  return (
    /* `fixed` in the margin, vertically centred. z-20 puts it over the page's
       own flow and under the floating bar and the corner controls, the same rung
       the window-level fades sit on. */
    <nav
      aria-label="Sections"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovered(false);
      }}
      className={`fixed left-6 top-1/2 z-20 hidden -translate-y-1/2 ${
        chatOpen ? "min-[1800px]:block" : "min-[1400px]:block"
      }`}
    >
      <ul>
        {sections.map((section, i) => {
          const isActive = section.id === active;
          const named = hovered || isActive;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "true" : undefined}
                onClick={(e) => {
                  /* Handled here rather than left to the browser so the scroll
                     can be smooth — and so it isn't when the OS asks for less
                     motion (lib/motion). The hash still lands in the URL, so
                     the section stays linkable and the back button works. */
                  const el = document.getElementById(section.id);
                  if (!el) return;
                  e.preventDefault();
                  el.scrollIntoView({
                    behavior: scrollBehavior(),
                    block: "start",
                  });
                  history.replaceState(null, "", `#${section.id}`);
                }}
                /* The outline reset needs something in its place, and a ring
                   isn't it here: focusing the rail already reveals all seven
                   labels, so the thing a keyboard user can't tell is *which*
                   row Enter will follow. So focus gets the same per-row
                   treatment hover gets, on the tick and the label — pointing
                   and tabbing answer the same way. */
                className="group flex h-5 items-center gap-[9px] rounded-sm focus-visible:outline-none"
              >
                {/* The tick. A 1px rule drawn as a background so its length can
                    animate without the layout of the row moving — height is
                    fixed by the row, and only `width` changes. */}
                <motion.span
                  aria-hidden="true"
                  initial={false}
                  animate={{ width: named ? TICK_LONG : TICK_REST }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.28, ease: EASE, delay: hovered ? i * 0.02 : 0 }
                  }
                  className={`h-px shrink-0 transition-colors duration-200 ${
                    isActive
                      ? "bg-foreground"
                      : "bg-foreground/25 group-hover:bg-foreground/50 group-focus-visible:bg-foreground/50"
                  }`}
                />

                {/* The name. `pointer-events-none` so it can't hold the rail
                    open from ground outside the ticks, and `absolute`-free: it
                    keeps its place in the row so the rail's width is stable and
                    the ticks never shift as words arrive. */}
                <motion.span
                  initial={false}
                  animate={{
                    opacity: named ? 1 : 0,
                    x: reduce ? 0 : named ? 0 : -4,
                  }}
                  transition={
                    reduce
                      ? { duration: 0.15 }
                      : { duration: 0.28, ease: EASE, delay: hovered ? i * 0.02 : 0 }
                  }
                  className={`pointer-events-none whitespace-nowrap text-xs leading-5 ${
                    isActive
                      ? "text-foreground"
                      : "text-muted group-focus-visible:text-foreground"
                  }`}
                >
                  {section.title}
                </motion.span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
