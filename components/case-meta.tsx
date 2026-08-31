"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SparkMark } from "@/components/spark-mark";
import { askPedro } from "@/lib/ask";

/* ────────────────────────────────────────────────────────────────────────
   A case study's credits, and the two things you can do with the page.

   It used to be five facts wrapping onto two lines — Company, Role, Year,
   Status, Team — which is a lot of furniture between the headline and the
   argument, and most of it answers a question nobody arrives with. Role and
   Team went: on a portfolio the role is the premise of the whole site, and the
   collaborators matter inside the story (where the case actually names them)
   rather than as a field. What's left is the three that place the work —
   company, year, whether it shipped — on one line, with the row's two actions
   at the other end and a hairline under all of it.

   The actions are the point of the change. A case study is long, and the two
   things a reader wants that the page can't do by scrolling are "tell me the
   short version" and "give me this link". So: Summarize hands the case to the
   assistant, and the link copies the URL.

   The two are deliberately unlike each other now, which is the design's doing:
   Summarize keeps its word, and the link is a bare glyph at the row's right
   edge that says its name in a tooltip when you point at it. Two labelled
   chips at the end of a credits line read as a toolbar; one label and one
   glyph read as a sentence with a button after it.
   ──────────────────────────────────────────────────────────────────────── */

/** What both actions share: no ground until you point at them, and then the
 *  site's own icon-hover ink rather than a surface (the reasoning is in
 *  components/ask-button — this row sits in the page, and a filled control
 *  here would outweigh the headline above it).
 *
 *  The corner is 12px, not the round end it used to have. Every other hover
 *  ground on the site is a 12px square — the two frame corners
 *  (components/ask-button, components/back-button), the assistant's cards and
 *  its follow-ups — and a capsule here was the one that answered a pointer
 *  with a different shape than the rest. At 36px tall, 12px still reads as
 *  visibly round; what it stops reading as is a pill, which is the shape of a
 *  thing you toggle rather than a glyph you press.
 *
 *  The box belongs to each button instead of to this list: one is a label with
 *  a glyph in front of it, the other is a glyph and nothing else (40×36 in the
 *  design). They only have to agree on height, and both are 36px — the height
 *  the design gives the row — so whichever one lights up, the ground that
 *  appears is the same weight. */
const ACTION = [
  "rounded-[12px] transition-[background-color,color,transform]",
  "duration-150 ease-out-strong",
  "hover:bg-foreground/[0.06] active:scale-[0.97]",
  "focus-visible:bg-foreground/[0.06] focus-visible:outline-none",
  "focus-visible:ring-2 focus-visible:ring-foreground/20",
].join(" ");

/** The icon swap, borrowed from components/copy-button so the two copy
 *  affordances on the site morph the same way: a blurred spring, scaled up
 *  from a quarter size, no bounce. Here it carries the tooltip's two words
 *  rather than two glyphs — see CopyLinkButton for why the movement moved. */
const MORPH = { type: "spring" as const, duration: 0.3, bounce: 0 };
const MORPH_FROM = { scale: 0.25, opacity: 0, filter: "blur(4px)" };
const MORPH_TO = { scale: 1, opacity: 1, filter: "blur(0px)" };

/** The site's arrival curve, stated as a tuple so framer takes it as a bezier
 *  rather than a keyword. */
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** How long the copied state holds before the tooltip says its name again. */
const COPIED_MS = 1600;

export function CaseMeta({
  company,
  url,
  year,
  status,
  title,
}: {
  company: string;
  /** The company's own site. Absent for cases with nothing to point at. */
  url?: string;
  year: string;
  status: string;
  /** Only used to name the case in the prompt Summarize sends. */
  title: string;
}) {
  return (
    <div className="mx-auto mt-12 flex w-full max-w-[39rem] items-center justify-between gap-4 border-b border-border pb-2.5">
      <dl className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm leading-5">
        <Fact label="Company">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:opacity-70"
            >
              {company}
            </a>
          ) : (
            company
          )}
        </Fact>
        <Fact label="Year">{year}</Fact>
        <Fact label="Status">{status}</Fact>
      </dl>

      {/* `shrink-0`: the credits wrap, the actions don't. */}
      <div className="flex shrink-0 items-center gap-2">
        <SummarizeButton title={title} company={company} />
        <CopyLinkButton />
      </div>
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 whitespace-nowrap">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Hands the case to the assistant and asks for the short version.
 *
 * It carries the sparkle rather than the corner's robot, and that's the whole
 * distinction between the two: this one arrives with a prompt about the thing
 * you're looking at, where the corner just opens the conversation. The chat
 * springs open on the same `pedro:ask` event every other CTA on the site uses,
 * so nothing here needs the chat's state.
 *
 * The prompt names the case and asks for the shape of a TL;DR rather than just
 * saying "summarize" — the assistant has the case's problem, solution, process
 * and results in its context (see lib/persona), and telling it which of those
 * to lead with is the difference between a summary and a list of fields.
 *
 * The air between the sparkle and the word is 7px, which is not the 4 the
 * design's auto-layout reports. The design's glyph is an instance — a 21px
 * frame with a 15.14px sparkle inside it — so 2.93px of the icon's own padding
 * stands between the ink and the frame's edge, and the 4px gap only starts
 * after that. The site's marks are ink-tight (components/spark-mark masks the
 * glyph's own bounding box, nothing around it), so that padding has nowhere to
 * live here and the number the eye was measuring all along has to be said out
 * loud: 4 + 2.93 ≈ 7. Same move as the corner button's label margin, and for
 * the same reason (components/ask-button).
 *
 * The other half of that padding doesn't come across, and shouldn't. In the
 * design the ground starts 10.93px to the left of the sparkle's ink where this
 * one starts at 8, because 11-and-8 is a pair only the icon frame's arithmetic
 * asks for — and nothing at rest can show it, since the ground doesn't exist
 * until you point at the button.
 */
function SummarizeButton({
  title,
  company,
}: {
  title: string;
  company: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        askPedro(
          `Give me the TL;DR of your "${title}" case at ${company} — what was broken, what you shipped, and what it moved. A few lines, not a list.`,
        )
      }
      className={`${ACTION} flex h-9 items-center gap-[7px] px-2 text-sm leading-5 text-foreground`}
      aria-label={`Summarize the ${title} case with the assistant`}
    >
      <SparkMark className="size-[15px] shrink-0" />
      Summarize
    </button>
  );
}

/**
 * Copies the page's own URL.
 *
 * A glyph and nothing else, 40×36 as the design draws it, at the right edge of
 * the row. What the missing label used to say arrives on hover instead, as the
 * design's tooltip: a chip above the button with a caret pointing back down at
 * it. A tooltip is the right trade for a control whose name you only need
 * once — the row gets its width back, and the name is still one pointer away.
 *
 * The tooltip is also where the confirmation happens now. It used to be the
 * glyph morphing link → check with the words "URL copied" arriving beside it:
 * two moving parts in the page, and the row grew while it spoke. So the glyph
 * holds still and the chip's own word changes — "Copy link" swaps to "Copied"
 * on the same blurred spring the icons used to trade on. Nothing outside the
 * chip moves, and the answer lands where the cursor already is.
 *
 * Both words share one grid cell, so the chip is always as wide as the wider
 * of them. "Copied" is the shorter, which means the box stays exactly the
 * width the design hugs around "Copy link" and the swap has no width to
 * animate. A chip resizing under a cross-fade would be the one part of the
 * exchange the eye actually followed.
 *
 * `window.location.href` is read at click time rather than built from props:
 * it's already the canonical URL in every environment, and reading it on the
 * client keeps the server render free of it.
 */
function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const [pointed, setPointed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  // The timeout outlives a fast navigation away from the page otherwise, and
  // fires setState on an unmounted button.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard can be unavailable (insecure context, denied permission).
      // Saying "copied" then would be a lie, so the state doesn't flip.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  /* Copied holds the chip open on its own. A pointer is usually still on the
     button when it flips, but a keyboard press or a tap has nothing keeping it
     there, and a confirmation nobody sees isn't one. */
  const open = pointed || copied;

  return (
    /* The tooltip is a sibling of the button, not a child: `active:scale` is on
       the button, and a chip inside it would be pressed along with the glyph. */
    <span className="relative flex">
      <button
        type="button"
        onClick={copy}
        onPointerEnter={() => setPointed(true)}
        onPointerLeave={() => setPointed(false)}
        /* Focus opens it too, but only the kind that came from a key: a click
           leaves the button focused, and without the test the chip would sit
           there saying "Copy link" after the copied state expired. */
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) setPointed(true);
        }}
        onBlur={() => setPointed(false)}
        /* The glyph rests at the row's own label ink — the design draws it a
           step down from the type beside it — and comes up to full ink when
           the ground arrives under it. */
        className={`${ACTION} grid h-9 w-10 place-items-center text-muted hover:text-foreground focus-visible:text-foreground`}
        /* The live region is the span below; this stays a stable name so a
           screen reader announces the button, not the state, on focus. */
        aria-label="Copy link to this case"
      >
        <LinkIcon />
      </button>

      <AnimatePresence>
        {open ? <Tooltip copied={copied} reduce={!!reduce} /> : null}
      </AnimatePresence>

      {/* Announced once per copy, without the visible word having to be a live
          region itself (it animates in and out, and a region that comes and
          goes re-announces on exit). */}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </span>
  );
}

/**
 * The design's tooltip, to the pixel: 8/4 padding, 6px radius, 12px/16px
 * medium type, and an 8px square turned 45° with its centre sitting on the
 * chip's bottom edge, so 5.66px of diagonal shows below it.
 *
 * The design's two colours — `#ededed` on `#18181b` — are this palette's own
 * pair read in dark mode, so the chip is stated as the inversion the site
 * already uses for `::selection`: ground `--foreground`, ink `--background`.
 * Written as the literal hexes it would stay a pale chip on a pale page in
 * light mode; written as the inversion it flips with the theme and is the one
 * surface on the site that is *meant* to be the opposite of the page.
 *
 * No shadow, as drawn. A tooltip that lifts is a small panel, and this is a
 * word — the page's own ink turned inside out is already the loudest thing in
 * the row for as long as it's there.
 *
 * The caret is the chip's sibling rather than its child, centred on the
 * button's axis: it points at the thing that was pressed, which stops being
 * the middle of the chip the moment the chip's word changes.
 *
 * Geometry: the wrapper's bottom edge is the button's top edge, `pb-2.5` is
 * the gap, and the caret's protruding half leaves ~4px of air over the glyph.
 * `w-0` + `items-center` is what centres a chip wider than its button without
 * spending a transform on it — framer owns this element's transform for the
 * slide, and Tailwind's `-translate-x-1/2` would be overwritten by it.
 */
function Tooltip({ copied, reduce }: { copied: boolean; reduce: boolean }) {
  return (
    <motion.span
      aria-hidden
      /* It rises the last few pixels out from behind the button rather than
         appearing in place. Arriving is the flourish and takes 200ms; leaving
         is getting out of the way and takes 100 — the site's usual asymmetry
         (components/ask-button). */
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: reduce ? 0.12 : 0.2, ease: EASE },
      }}
      exit={{
        opacity: 0,
        y: reduce ? 0 : 4,
        transition: { duration: 0.1, ease: EASE },
      }}
      className="pointer-events-none absolute bottom-full left-1/2 z-20 flex w-0 flex-col items-center pb-2.5"
    >
      <span className="grid justify-items-center rounded-[6px] bg-foreground px-2 py-1">
        <Word show={!copied} reduce={reduce}>
          Copy link
        </Word>
        <Word show={copied} reduce={reduce}>
          Copied
        </Word>
      </span>
      <span className="absolute bottom-2.5 left-0 size-2 -translate-x-1/2 translate-y-1/2 rotate-45 bg-foreground" />
    </motion.span>
  );
}

/** One of the chip's two words. Both are always mounted and stacked in the
 *  same grid cell — that's what fixes the chip's width — so this animates
 *  between the morph's two ends instead of entering and exiting.
 *  `initial={false}` is why the tooltip opens with its word already there: the
 *  entrance belongs to the chip, and a word springing in on top of it would be
 *  two arrivals for one event. */
function Word({
  show,
  reduce,
  children,
}: {
  show: boolean;
  reduce: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.span
      initial={false}
      animate={
        reduce
          ? { opacity: show ? 1 : 0 }
          : show
            ? MORPH_TO
            : MORPH_FROM
      }
      transition={reduce ? { duration: 0.15 } : MORPH}
      className="[grid-area:1/1] whitespace-nowrap text-[12px] font-medium leading-4 text-background"
    >
      {children}
    </motion.span>
  );
}

/* The design's own link glyph (f0's `link`, which isn't a dependency here), its
   path data exported from Figma with the baked #BBBBBB swapped for
   currentColor so the button drives it — same deal as the arrow in
   components/back-button.
   
   24×24 is the icon's box, not the shape: the glyph inside is 15.37px and sits
   centred with 4.31px of air on every side, which is why a 24px icon reads at
   the same weight as the 15px sparkle two elements to its left. Both
   dimensions are stated, so the box keeps that air instead of collapsing onto
   the shape. */
function LinkIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.5399 9.54C9.8983 8.1816 12.1014 8.1816 13.4598 9.54C13.7136 9.7939 13.7136 10.2061 13.4598 10.46C13.206 10.7138 12.7937 10.7138 12.5399 10.46C11.6892 9.6092 10.3105 9.6092 9.4598 10.46L6.4598 13.46C5.3329 14.5868 5.3329 16.4132 6.4598 17.54C7.5867 18.6669 9.413 18.6669 10.5399 17.54C10.7937 17.2862 11.206 17.2862 11.4598 17.54C11.7136 17.7939 11.7136 18.2061 11.4598 18.46C9.8253 20.0945 7.1744 20.0945 5.5399 18.46C3.9053 16.8254 3.9053 14.1746 5.5399 12.54L8.5399 9.54ZM12.5399 5.54C14.1744 3.9055 16.8253 3.9055 18.4598 5.54C20.0943 7.1746 20.0943 9.8254 18.4598 11.46L15.4598 14.46C14.1014 15.8184 11.8983 15.8184 10.5399 14.46C10.286 14.2061 10.286 13.7939 10.5399 13.54C10.7937 13.2862 11.206 13.2862 11.4598 13.54C12.3105 14.3908 13.6892 14.3908 14.5399 13.54L17.5399 10.54C18.6667 9.4132 18.6667 7.5868 17.5399 6.46C16.413 5.3331 14.5867 5.3331 13.4598 6.46C13.206 6.7138 12.7937 6.7138 12.5399 6.46C12.286 6.2061 12.286 5.7939 12.5399 5.54Z"
        fill="currentColor"
      />
    </svg>
  );
}
