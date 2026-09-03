import { Fragment } from "react";

/**
 * The bespoke diagrams a case study places between its blocks, keyed by
 * StoryBlock.name.
 *
 * These are figures made of type rather than of pixels — a raster of tracked
 * events, a map of candidate triggers — so they belong here rather than in the
 * media registry (see lib/animations): nothing about them enlarges, because
 * they're already at reading size, and a lightbox would only reveal the same
 * 14px labels at the same 14px.
 *
 * Each one owns its geometry and its labels; the caption and the small print
 * under the stage come from the story block, because those are prose and prose
 * lives with the case (see lib/projects). They all draw on the same neutral
 * field the media figures use, so a run of them reads as one column of figures
 * and not as a diagram section that wandered into a case study.
 *
 * ## Why the connectors are re-drawn rather than exported
 *
 * The design's arrows, fan-in and dashed rules are vector layers, and Figma
 * exports them with the stroke baked in — `#EDEDED`, which is the dark theme's
 * --foreground. Shipped as assets they'd be invisible against the light
 * theme's near-white stage. So the geometry is transcribed exactly (same
 * viewBox, same path data, same 28% ink) and only the paint is changed, to
 * `currentColor`, which the theme already answers.
 */
export const STORY_DIAGRAMS: Record<
  string,
  React.ComponentType<{ note?: string }>
> = {
  "session-raster": SessionRaster,
  "buying-journeys": BuyingJourneys,
};

/**
 * The connector between two chips: a hairline with a solid head, 53×6.
 *
 * Exported for the operating-model flow in components/project-story, which
 * draws the same edge when its steps carry labels — the label needs something
 * long enough to sit over, which a `→` glyph isn't.
 */
export function EdgeArrow() {
  return (
    <svg
      width="53"
      height="6"
      viewBox="0 0 53 6"
      fill="none"
      aria-hidden="true"
      className="shrink-0 opacity-[0.28]"
    >
      <path d="M0 3H47" stroke="currentColor" />
      <path d="M47 0.5L53 3L47 5.5V0.5Z" fill="currentColor" />
    </svg>
  );
}

/** The stage every diagram here sits on, at the height its design gives it. */
function Stage({
  height,
  note,
  children,
}: {
  height: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    // `mx-auto w-fit`, for the reason spelled out on the flow in
    // components/project-story: the block centres while it fits and pins to
    // the left edge when it doesn't, where `justify-center` would split the
    // overflow both ways and put the leftmost label out of reach.
    <div
      className={`mx-auto flex w-fit flex-col gap-6 px-6 py-10 sm:justify-center sm:px-16 sm:py-14 ${height}`}
    >
      {children}
      {note ? <p className="text-xs leading-4 text-muted">{note}</p> : null}
    </div>
  );
}

/* ── The session raster ─────────────────────────────────────────────────── */

/**
 * Eight beta sessions, one row each, and one mark per tracked event.
 *
 * The point of the figure is a vertical band: in every session the events
 * cluster in the three columns immediately right of the dashed rule, which is
 * where the AI hands back its output. So the marks are positioned rather than
 * counted — the columns have to line up across all eight rows or there's no
 * band to see — and the highlight is a property of the column, not of the
 * event: every mark that falls in the band is lit, and nothing outside it is.
 *
 * Column i's left edge is 128 + 24i, which puts the rule at 550 — the midpoint
 * of the gap between column 17 and column 18. The whole raster is 876px wide
 * and scrolls sideways in anything narrower; there's no responsive version of
 * a raster, because a raster with fewer columns is a different reading.
 */
const COLUMNS = 32;
/** Where the AI's output lands. Every mark in these columns reads as after. */
const BAND = [18, 19, 20];

const SESSIONS: { label: string; rows: number[][] }[] = [
  {
    label: "Legal drafting",
    rows: [
      [0, 1, 2, 3, 4, 11, 12, 13, 16, 17, 18, 19, 20, 23, 27],
      [1, 2, 6, 7, 12, 13, 14, 16, 17, 18, 19, 22, 26, 28, 29, 30, 31],
      [4, 5, 10, 13, 14, 15, 17, 18, 19, 20, 21, 22, 25, 26, 27, 30, 31],
      [0, 5, 7, 9, 11, 14, 16, 18, 19, 20, 21, 23, 26, 27, 29, 30],
    ],
  },
  {
    label: "Legal research",
    rows: [
      [1, 2, 3, 6, 7, 8, 10, 11, 14, 15, 16, 18, 19, 21, 23, 25, 31],
      [0, 1, 2, 4, 5, 6, 9, 10, 11, 14, 18, 19, 20, 22, 23, 26, 27],
      [0, 1, 2, 4, 6, 7, 9, 10, 16, 18, 23, 31],
      [6, 8, 9, 14, 17, 18, 19, 20, 21, 22, 24, 30, 31],
    ],
  },
];

function SessionRaster({ note }: { note?: string }) {
  return (
    <Stage height="sm:h-[357px]" note={note}>
      <div className="relative h-[166px] w-[876px]">
        {/* The rule and its label sit above the rows and outside them, so the
            label has the 22px of headroom the group stack is padded by. */}
        <p className="absolute left-[558px] top-0 text-[11px] leading-4 text-muted">
          AI delivers the output
        </p>
        <div className="absolute bottom-0 left-[550px] top-4 border-l border-dashed border-foreground/[0.22]" />

        <div className="flex flex-col gap-8 pt-[22px]">
          {SESSIONS.map((group) => (
            <div key={group.label} className="flex items-center gap-4">
              {/* Centred against its own four rows, which is what makes the
                  label read as naming the group rather than a row in it. */}
              <span className="w-28 shrink-0 text-sm leading-5 text-muted">
                {group.label}
              </span>
              <div className="flex flex-col gap-2">
                {group.rows.map((events, row) => {
                  const present = new Set(events);
                  return (
                    <div key={row} className="flex gap-5">
                      {Array.from({ length: COLUMNS }, (_, column) => (
                        <span
                          key={column}
                          className={`h-2 w-1 rounded-sm ${
                            !present.has(column)
                              ? ""
                              : BAND.includes(column)
                                ? "bg-foreground/85"
                                : "bg-foreground/[0.14]"
                          }`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ── The buying journeys ────────────────────────────────────────────────── */

/**
 * Four candidate upgrade triggers, one purchase path.
 *
 * Absolutely positioned on the design's own 759×210 canvas, and deliberately
 * so: the fan-in is a single path whose four arms land on the four chips'
 * centres, so the chips can't be allowed to size themselves — a chip 2px
 * taller than the design's 38 and the arm arrives at its shoulder. Every box
 * here states its height for that reason.
 *
 * Dashed is what was left on the table, solid what was taken forward, and the
 * fan-in is drawn twice for the same reason: once at 28% for all four arms,
 * then again at 50% for the arm that was chosen, so the diagram's argument is
 * legible before you've read the small print.
 */
const CANDIDATES: { label: string; chosen?: boolean }[] = [
  { label: "At sign-up" },
  { label: "Before the answer" },
  { label: "After the output limit", chosen: true },
  { label: "On the next task" },
];

/** Chip → chip, once past the fan-in. */
const CHIP = "absolute flex h-[38px] items-center rounded-md px-4 text-sm leading-5";
const FILLED = `${CHIP} justify-center border border-foreground/10 bg-foreground/[0.06] font-medium text-foreground`;

function BuyingJourneys({ note }: { note?: string }) {
  return (
    <Stage height="sm:h-[382px]" note={note}>
      <div className="relative h-[210px] w-[759px] text-foreground">
        {CANDIDATES.map((candidate, i) => (
          <Fragment key={candidate.label}>
            <span
              className="absolute left-0 text-sm leading-5 text-muted tabular"
              style={{ top: 9 + i * 52 }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={`${CHIP} left-[34px] w-44 justify-center ${
                candidate.chosen
                  ? "border border-foreground/[0.14] bg-foreground/[0.06] font-medium text-foreground"
                  : "border border-dashed border-foreground/[0.26] text-foreground/90"
              }`}
              style={{ top: i * 52 }}
            >
              {candidate.label}
            </span>
          </Fragment>
        ))}

        <FanIn />

        <span className={`${FILLED} left-[292.5px] top-[78px] w-34`}>
          Paywall
        </span>

        <Edge label="picks a plan" left={442} arrowLeft={446.5} />
        <span className={`${FILLED} left-[512px] top-[78px]`}>Plans</span>

        <Edge label="checkout" left={591.5} arrowLeft={589} />
        <span className={`${FILLED} left-[650px] top-[78px]`}>Subscribed</span>

        {/* The branch: dismissed, and out the bottom rather than onward. */}
        <DownConnector />
        <span className="absolute left-[375px] top-[136px] text-[11px] leading-4 text-muted">
          dismissed
        </span>
        <span
          className={`${CHIP} left-[302px] top-[172px] border border-foreground/10 text-muted`}
        >
          Continue free
        </span>
      </div>
    </Stage>
  );
}

/** A labelled edge on the purchase path, at the chips' own centre line. */
function Edge({
  label,
  left,
  arrowLeft,
}: {
  label: string;
  left: number;
  arrowLeft: number;
}) {
  return (
    <>
      <span
        className="absolute top-[77px] text-[11px] leading-4 text-muted"
        style={{ left }}
      >
        {label}
      </span>
      <span className="absolute top-[94px]" style={{ left: arrowLeft }}>
        <EdgeArrow />
      </span>
    </>
  );
}

/** Four arms into one spine, and one arrow out of it. */
function FanIn() {
  return (
    <>
      <svg
        width="72"
        height="194"
        viewBox="0 0 72 194"
        fill="none"
        aria-hidden="true"
        className="absolute left-[210px] top-0 opacity-[0.28]"
      >
        <path
          d="M0 19H26C30 19 32 21 32 25V91M32 91C32 95 34 97 38 97M32 91V77C32 73 30 71 26 71H0M38 97C34 97 32 99 32 103M38 97H66M0 123H26C30 123 32 121 32 117V103M32 103V169C32 173 30 175 26 175H0"
          stroke="currentColor"
        />
        <path d="M66 94.5L72 97L66 99.5V94.5Z" fill="currentColor" />
      </svg>
      <svg
        width="72"
        height="194"
        viewBox="0 0 72 194"
        fill="none"
        aria-hidden="true"
        className="absolute left-[210px] top-0 opacity-50"
      >
        <path
          d="M0 123H26C30 123 32 121 32 117V103C32 99 34 97 38 97H66"
          stroke="currentColor"
        />
        <path d="M66 94.5L72 97L66 99.5V94.5Z" fill="currentColor" />
      </svg>
    </>
  );
}

/** Off the purchase path: dashed down to the free outcome. */
function DownConnector() {
  return (
    <svg
      width="6"
      height="40"
      viewBox="0 0 6 40"
      fill="none"
      aria-hidden="true"
      className="absolute left-[360px] top-[124px] opacity-[0.28]"
    >
      <path d="M3 0V33" stroke="currentColor" strokeDasharray="3 3" />
      <path d="M0 34L3 39L6 34H0Z" fill="currentColor" />
    </svg>
  );
}
