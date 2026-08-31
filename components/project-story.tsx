import { Fragment } from "react";
import { MediaFigure } from "@/components/project-media";
import { sectionId, type FlowRow, type Metric, type Signal, type StoryBlock } from "@/lib/projects";

/** The reading column — 624px in the design. Figures run to the full 1024. */
const COLUMN = "mx-auto w-full max-w-[39rem]";

/**
 * The space above a block, read off the pair of kinds rather than stored on the
 * block itself.
 *
 * Five values, and every gap on the page is one of them:
 *
 *   12  inside a section — the eyebrow and the copy under it are one thought
 *   32  where copy meets a structured block, and where it resumes after one
 *   40  around a figure, and under the item that introduces one
 *   64  between the items of a numbered run
 *   88  between sections
 *
 * They're relational because the design's rhythm is: the same numbered item
 * opens a run 40px under its section's intro and continues one 64px under the
 * figure before it. Storing that on the block would ask the author to keep two
 * orders in sync — the one the blocks are in, and the one the spacing implies.
 * The list is the only order there is, and this reads it.
 */
function gapAbove(block: StoryBlock, prev?: StoryBlock): string {
  if (!prev) return "";

  // A new section always gets the full break. The design varied this and the
  // page read unevenly for it — two figures ended the same way and the section
  // after one of them sat closer than the section after the other.
  if (block.kind === "section") return "mt-22";

  // Whatever comes first under an eyebrow belongs to it, structured or not.
  if (prev.kind === "section") return "mt-3";

  switch (block.kind) {
    case "step":
      return prev.kind === "figure" ? "mt-16" : "mt-10";
    case "figure":
    case "flow":
      return "mt-10";
    case "stats":
    case "metrics":
    case "steps":
    case "comparison":
      return "mt-8";
    default:
      // Copy sits a line-height under more copy, and takes the wider break
      // where it picks up after a block of numbers or signals.
      return prev.kind === "lead" ||
        prev.kind === "text" ||
        prev.kind === "intro"
        ? "mt-3"
        : "mt-8";
  }
}

/**
 * A case study told in blocks (see StoryBlock), in place of the fixed
 * problem → solution → process → results page.
 *
 * The caller hands this the figure column's width and it narrows its own copy
 * back to the reading column, which is what lets a figure sit between two
 * numbered items without either of them leaving the flow.
 */
export function ProjectStory({
  story,
  results,
}: {
  story: StoryBlock[];
  results: Metric[];
}) {
  // A fragment, not a wrapper: the blocks are siblings in the article's own
  // column, and a div here would be an element with nothing to do.
  return (
    <>
      {story.map((block, i) => (
        <Block
          key={i}
          block={block}
          className={gapAbove(block, story[i - 1])}
          results={results}
        />
      ))}
    </>
  );
}

function Block({
  block,
  className,
  results,
}: {
  block: StoryBlock;
  className: string;
  results: Metric[];
}) {
  switch (block.kind) {
    /* The anchor the rail scrolls to (components/section-rail). `scroll-mt`
       clears the floating nav, matching the article's own. */
    case "section":
      return (
        <h2
          id={sectionId(block.title)}
          className={`${COLUMN} ${className} scroll-mt-24 text-sm font-medium text-muted`}
        >
          {block.title}
        </h2>
      );

    /* The one piece of copy the design sets smaller than the body while leaving
       it at full strength — it opens the section, so it reads as its first
       sentence and not as an aside, which is the foreground it would lose at
       `text`'s 80%. The 26px leading is the body's rather than its own: it sits
       in a run of 16px copy and has to hold that rhythm when it wraps. */
    case "intro":
      return (
        <p className={`${COLUMN} ${className} text-sm leading-6.5 text-foreground`}>
          {block.text}
        </p>
      );

    case "lead":
      return (
        <p
          className={`${COLUMN} ${className} font-medium leading-relaxed text-foreground`}
        >
          {block.text}
        </p>
      );

    case "text":
      return (
        <p className={`${COLUMN} ${className} leading-relaxed text-foreground/80`}>
          {block.text}
        </p>
      );

    /* What the old model cost. The Results numbers at body size: same weight,
       same 80% ink, same tight tracking — a smaller relative of that row, not a
       second style.

       Columns capped at the design's 164px and spread by `justify-between`
       rather than divided into equal thirds. The cap is doing typographic work:
       at a third of the measure the three labels break at three different
       points — one line, then two, then two uneven ones — and the row stops
       reading as a set. Held to 164px they all wrap, and the values line up
       over labels of the same shape. Below `sm` they stack and each one gets
       the full column, where a single line is the right answer. */
    case "stats":
      return (
        <dl
          className={`${COLUMN} ${className} flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-4`}
        >
          {block.items.map((metric) => (
            <div key={metric.label} className="space-y-0.5 sm:max-w-[10.25rem]">
              <dt className="font-medium leading-relaxed tracking-tight text-foreground/80 tabular">
                {metric.value}
              </dt>
              <dd className="text-sm leading-snug text-muted">{metric.label}</dd>
            </div>
          ))}
        </dl>
      );

    case "metrics":
      return (
        <dl
          className={`${COLUMN} ${className} grid grid-cols-1 gap-6 sm:grid-cols-3`}
        >
          {results.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <dt className="text-[30px] font-medium leading-9 tracking-tight text-foreground/80 tabular">
                {metric.value}
              </dt>
              <dd className="text-sm leading-snug text-muted">{metric.label}</dd>
            </div>
          ))}
        </dl>
      );

    case "steps":
      return (
        <ol className={`${COLUMN} ${className} space-y-6`}>
          {block.items.map((item, i) => (
            <li key={item.title}>
              <Step n={String(i + 1).padStart(2, "0")} title={item.title}>
                {item.text}
              </Step>
            </li>
          ))}
        </ol>
      );

    /* A numbered item outside any list, because its figure follows it and the
       figure is twice the column wide. The marker is authored rather than
       counted for the same reason: nothing here knows it's the second of four. */
    case "step":
      return (
        <div className={`${COLUMN} ${className}`}>
          <Step n={block.n} title={block.title}>
            {block.text}
          </Step>
        </div>
      );

    case "comparison":
      return (
        <div
          className={`${COLUMN} ${className} grid grid-cols-1 gap-6 sm:grid-cols-2`}
        >
          {block.columns.map((column) => (
            <div key={column.title} className="space-y-2 border-t border-border pt-4">
              <h3 className="font-medium leading-relaxed text-foreground">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.signals.map((signal) => (
                  <SignalRow key={signal.label} signal={signal} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case "figure":
      return (
        <div className={className}>
          <MediaFigure item={block.media} />
        </div>
      );

    case "flow":
      return (
        <div className={className}>
          <Flow rows={block.rows} caption={block.caption} />
        </div>
      );
  }
}

/** A numbered item: the marker hangs in its own 18px column so a run of them
 *  lines up on one edge, and the title and body share a single line height so
 *  each item reads as one paragraph with a bold first line. */
function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="w-[18px] shrink-0 text-sm leading-6.5 text-muted tabular">
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="font-medium leading-relaxed text-foreground">{title}</h3>
        <p className="leading-relaxed text-foreground/80">{children}</p>
      </div>
    </div>
  );
}

/** Up is the good news, and it's brighter for it — the column worth reading
 *  first is the one that isn't muted. The arrow is hidden from assistive tech:
 *  the labels already say which way each reading went. */
function SignalRow({ signal }: { signal: Signal }) {
  const up = signal.trend === "up";
  return (
    <li
      className={`flex gap-2 text-sm leading-5 ${
        up ? "text-foreground/90" : "text-muted"
      }`}
    >
      <span aria-hidden="true">{up ? "↑" : "↓"}</span>
      <span>{signal.label}</span>
    </li>
  );
}

/**
 * The operating model, before and after.
 *
 * On the same stage the media figures use — one neutral field for every figure
 * in the case, so the diagram reads as part of the same run rather than as a
 * different kind of thing. It doesn't darken on hover and doesn't open: there's
 * nothing to enlarge, it's already type at reading size.
 *
 * The two rows share a left edge, so the labels line up and the chips start
 * under each other — which is the point of the figure: you read straight down
 * from "Customer → Specialist" to "Customer → AI orchestration". The design
 * centres each row on its own, and at these two lengths that offsets the labels
 * by 67px and reads as a mistake rather than as a choice.
 *
 * The flow is 850px at its widest, so it scrolls sideways in anything narrower.
 * `mx-auto w-fit` is what makes that safe: the block centres while it fits and
 * pins to the left edge when it doesn't, where `justify-center` would have
 * split the overflow both ways and put the first chip out of reach. Below `sm`
 * the label moves above its row, so the horizontal room all goes to the chips.
 *
 * The chip outlines are `foreground/10` rather than `border-border`, which is
 * the token they look like they want. --border is tuned against the page
 * ground; these are drawn on the stage, which is already a step up from it, and
 * the token disappeared into it completely — the Before row read as bare text
 * with no chips at all.
 */
function Flow({ rows, caption }: { rows: FlowRow[]; caption: string }) {
  return (
    <figure className="space-y-2.5">
      <div className="scrollbar-none overflow-x-auto rounded-lg bg-foreground/[0.04]">
        <div className="mx-auto flex w-fit items-center px-6 py-10 sm:h-[357px] sm:px-16 sm:py-14">
          <div className="flex flex-col items-start gap-10 sm:gap-16">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-6"
              >
                <span className="text-sm leading-5 text-muted sm:w-16 sm:shrink-0">
                  {row.label}
                </span>
                <div className="flex items-center gap-3">
                  {row.steps.map((step, i) => (
                    <Fragment key={`${step.label}-${i}`}>
                      {i > 0 ? (
                        <span
                          aria-hidden="true"
                          className="text-sm leading-5 text-muted"
                        >
                          →
                        </span>
                      ) : null}
                      <span
                        className={[
                          "whitespace-nowrap rounded-md px-4 py-[9px] text-sm leading-5",
                          step.key
                            ? // The one thing that changed, on the site's own
                              // filled-control pair — which is, in the dark
                              // theme, the exact #d4d4d4 / #141414 the design
                              // draws it with.
                              "bg-accent font-medium text-accent-fg"
                            : row.active
                              ? "border border-foreground/10 bg-foreground/[0.06] font-medium text-foreground"
                              : "border border-foreground/10 text-muted",
                        ].join(" ")}
                      >
                        {step.label}
                      </span>
                    </Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mx-auto max-w-xl text-center text-sm font-medium leading-relaxed text-muted">
        {caption}
      </figcaption>
    </figure>
  );
}
