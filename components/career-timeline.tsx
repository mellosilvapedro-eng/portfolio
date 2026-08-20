import Link from "next/link";
import { CasePreview } from "@/components/case-preview";
import { publishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";

/* Experience and work as one thing.

   They used to be two sections — a career list, then a flat list of case
   studies — which asked the reader to hold a company in mind while scrolling to
   find what was shipped there. Now each case study hangs off the job it came
   out of, and the whole run is strung on a single rail: period on the left, a
   dot on the line, the role and its work on the right.

   The association is `company`, matched against `site.experience`. Nothing is
   duplicated to make this layout work — a case study that names a company with
   no matching job simply doesn't appear here, which is the right failure: the
   fix is the data, not the view.

   ── The period sticks ────────────────────────────────────────────────────────
   Each period and its dot ride down with the scroll, park 96px from the top of
   the viewport, hold while you read the entry, then get pushed out by the next
   one arriving from below. No scroll listener and no observer: `position:
   sticky` is trapped inside its parent's box, so a sticky child of a cell that
   is exactly as tall as one entry owns the screen for exactly that entry, and
   the hand-off is the parent's bottom edge catching up. Travel distance is
   `cellHeight − labelHeight`, which is why the 96px below each entry is load
   bearing rather than decoration — it's the runway. The design used to say 44px
   there and the code carried 64 to make the short entries park rather than just
   drift past; the design now says 96, which is more runway than any of them
   need, so the hand-tuned number goes away.

   Three things this depends on, each of which fails silently:

   - The cells stretch to the row (grid's default `align-self`). That stretch IS
     the runway. It's also why the period sits in a plain block cell with the
     sticky <span> inside it — make the cell itself the sticky element and it
     stretches to its own parent's height, leaving nothing to travel.
   - The dot's *box* is one line tall and carries the same offset as the period,
     so the two travel identically. A bare 6px dot nudged down with margin
     drifts once parked: Chromium puts a stuck element's border edge at `top`
     and drops the margin.
   - No ancestor may have `overflow` (other than visible), `transform`,
     `filter`, `contain: paint` or `container-type` — each one hands sticky a
     different reference frame. The shell is clear of all of them today; the
     entrance animation's `translateY(0)` is a containing block but not a
     scrollport, so it doesn't take part.

   96px is the parked position because the window's top fade is 80px tall
   (components/site-shell): park any higher and the label holds still while
   dissolving into the ground. Riding *out* through that fade is the point — the
   period leaves by dissolving rather than by clipping.

   Below sm none of this applies. The period moves above the role (112px of
   gutter would leave the description too narrow to read), which leaves its row
   one line tall — no runway, so sticky could only jitter. It stays static and
   the rail keeps the timeline reading as one.

   Stacked, the vertical beats are what carry the structure the columns carried,
   so they step: 4px inside the entry, 8px under the period, 24px to the case
   links, 48px to the next entry. The last is 96px on the desktop row because
   there it is also the sticky runway — on a 390px screen that much empty space
   is just scrolling, and 48 keeps the ladder roughly doubling.

   ── Column arithmetic ───────────────────────────────────────────────────────
   Left edge to the role heading: 112px period + 12 gap + 6px rail + 12 gap +
   12 of the row's own padding = 154px. The last 12 is the `pl-3` on the content
   cell rather than more gap, because the grid's one `gap-x` serves both
   gutters.

   The period column is 112px where the design says 102: "2021 — 2025" measures
   107.6px in Inter at 16px, so the design's width wraps it onto a second line.
   `whitespace-nowrap` is the real guard — it keeps the label on one line even
   if the font falls back to something wider — and the extra 10px is what stops
   an overflowing label from crowding the rail. */

/** The period's line box: 16px on a 1.575 leading. The dot's box matches it. */
const LINE = "1.575rem";
/** Half of it — where the dot's centre lands, and where the rail leaves it. */
const HALF_LINE = "0.7875rem";

export function CareerTimeline() {
  const jobs = site.experience;

  return (
    <ol>
      {jobs.map((job, i) => {
        const cases = publishedProjects.filter((p) => p.company === job.company);
        const isLast = i === jobs.length - 1;

        return (
          <li
            key={`${job.company}-${job.period}`}
            className="grid grid-cols-[0.375rem_1fr] gap-x-3 sm:grid-cols-[7rem_0.375rem_1fr]"
          >
            {/* The rail. Each entry carries its own segment, starting at its
                dot's centre and running the full height of the stretched cell —
                so it ends exactly half a line below the cell, which is exactly
                where the next entry's segment starts. One continuous line, no
                element spanning the list, and it survives an entry being
                added, removed or reordered.

                The last segment fades out instead of stopping dead. It has to
                exist at all because the dot above it is sticky: cut the line at
                the final dot and that dot floats off the end of the rail as
                soon as it starts travelling. */}
            <div
              aria-hidden="true"
              className="relative col-start-1 row-span-2 flex sm:col-start-2 sm:row-span-1 sm:row-start-1"
            >
              <div
                className="flex w-1.5 flex-none items-center sm:sticky sm:top-24"
                style={{ height: LINE }}
              >
                <span className="size-1.5 rounded-full bg-foreground/65" />
              </div>
              <span
                className={`absolute left-[2.5px] h-full w-px ${
                  isLast
                    ? "bg-gradient-to-b from-foreground/15 to-transparent"
                    : "bg-foreground/15"
                }`}
                style={{ top: HALF_LINE }}
              />
            </div>

            {/* A block, deliberately: a flex or grid container here would
                stretch its child to the cell and kill the travel.

                Stacked, the period needs its own beat under it or it reads as a
                third line of the entry rather than as the entry's label — the
                gap to the role was the same leading slack as the gap between
                the role and its summary, so all three sat in one undifferentiated
                block. 8px is the smallest "between" beat; the 4px under the role
                stays the "inside" one, and the two together are what group the
                role with its summary and set the period above them.
                Nothing to do on the desktop row, where the period is a column of
                its own and the separation is horizontal. */}
            <div className="col-start-2 row-start-1 pb-2 sm:col-start-1 sm:pb-0">
              <span className="block whitespace-nowrap leading-[1.575] text-foreground/65 sm:sticky sm:top-24 tabular">
                {job.period}
              </span>
            </div>

            <div
              className={`col-start-2 row-start-2 min-w-0 sm:col-start-3 sm:row-start-1 sm:pl-3 ${
                isLast ? "" : "pb-12 sm:pb-24"
              }`}
            >
              {/* The 460px measure is the prose's, not the cell's. The case
                  rows below run the full width of the column — they're a list
                  with a hover field, and a field that stopped 10px short of
                  where the column ends would read as a mistake rather than as a
                  measure. Holding the cap here is also what keeps the role and
                  its summary breaking where the design breaks them. */}
              <div className="max-w-[28.75rem]">
                <h3 className="pb-1 leading-[1.575] text-foreground">
                  {job.role} at{" "}
                  {job.url ? (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link hover:opacity-70"
                    >
                      {job.company}
                    </a>
                  ) : (
                    job.company
                  )}
                </h3>
                <p className="leading-[1.4] text-foreground/65">
                  {job.description}
                </p>
              </div>

              {/* What shipped there. Indented by the row's own padding rather
                  than pulled flush like the experiments list, so the hover
                  field reads as belonging to the job above it. It reads at the
                  role's own 16px now — it used to be a size under it — so
                  weight is the whole difference: medium against the role's
                  regular. No year — the period on the rail already dated
                  everything under it.

                  24px off the description, and the row's own 14px of padding
                  sits inside that, so the first title lands 38px below the
                  summary; 12px between the rows themselves. The set has to read
                  as a group hanging off the entry, which means the space above
                  it stays wider than the space within it. */}
              {cases.length > 0 ? (
                <ul className="mt-6 space-y-3">
                  {cases.map((project) => (
                    <li key={project.slug}>
                      {/* The row is the link; the card the wrapper hangs over
                          it on hover is the case's own first piece of media,
                          so the list shows what it's pointing at. */}
                      <CasePreview media={project.media}>
                        <Link
                          href={`/${project.slug}`}
                          className="group flex items-baseline gap-2 rounded-lg px-3 py-3.5 text-base font-medium leading-snug transition-colors duration-150 hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
                        >
                          <span className="text-foreground transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5">
                            {project.title}
                          </span>
                          <span
                            aria-hidden="true"
                            className="-translate-x-1 shrink-0 text-muted opacity-0 transition duration-200 ease-out-strong group-hover:translate-x-0 group-hover:opacity-100"
                          >
                            ↗
                          </span>
                        </Link>
                      </CasePreview>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
