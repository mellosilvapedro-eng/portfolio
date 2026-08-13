import { CELL, LOGO_CELLS, VIEWBOX } from "@/lib/logo-pixels";

/* ────────────────────────────────────────────────────────────────────────
   The mark, with the loader's wave running over it.

   The logo is already a pixel grid — a dithered disc on a 20×20 lattice — so
   the assistant's loader can run on the real thing instead of on a 3×3 stand-in.
   The mark is simply *there*, whole, at its own greys; a chevron front crosses
   it on a loop, lifting each cell as it passes and letting it fall back. Cells
   switching on and off, which is all `pixel-on` in globals.css ever did. The
   thing that holds the gap before an answer and the thing that opens the site
   are the same object doing the same trick.

   The mark does not assemble itself. An earlier pass had the front *build* the
   disc cell by cell, and it was the wrong idea twice over: it made the wave
   structural, so the wave couldn't loop, and it meant the first third of the
   splash showed a shape that wasn't the logo yet. Fading the whole mark in and
   letting the wave play over a mark that's already legible keeps the logo the
   subject and the motion an accent — which is the right way round.

   Drawn from data rather than as an <img> because an <img> can't be lit one
   cell at a time. The cells have to be addressable.

   One ink at varying opacity, not 77 greys. The art is a light disc drawn for a
   dark ground, and `currentColor` + opacity gets both themes for free — on
   #0a0a0a the bright cells read as light, on #fcfcfc the same values read as
   ink, because what the data encodes is *coverage*, not colour. That also
   leaves the plate behind the disc out entirely, so the mark sits on the page's
   own ground instead of on a near-white square.

   This is a server component: the markup ships in the HTML so the splash can
   paint on the first frame, with no hydration to wait for. The keyframes live
   in globals.css (`pixel-highlight`), which is also where reduced motion drops
   the wave and leaves the mark to sit still.
   ──────────────────────────────────────────────────────────────────────── */

/** ms per step along the lattice diagonal, which `col + row` counts from 0 at the
    top-left corner to 38 at the bottom-right. 38 steps at 22ms is an ~836ms
    crossing.

    That number and the 420ms cycle in globals.css are one decision, not two.
    Their ratio is how many waves are on the disc at a time — 836 / 420 ≈ 2, so a
    second front is halfway across before the first one leaves, which is what
    makes the mark read as *on, off, on, off* rather than as a single pass.

    The same ratio sets the band width: a cell sits above half brightness for
    roughly half its cycle, so each band covers about 0.5 × 420 / 22 ≈ 9.5 of the
    38 steps. Two bands of a quarter of the field each, with dark between them. */
const STEP = 22;

/** How far a cell may fall behind the front, in ms — the diffuse edge.

    Kept to about a third of a band on purpose. Jitter is what stops the front
    being a ruled line: cells near the edge fire early or late, so the band
    arrives as a spray of pixels rather than as a bar. Push it past the band width
    (an earlier pass used 260ms against a 7-step band) and the bands smear into
    each other until there's no wave left, just undirected twinkle. */
const JITTER = 130;

/** A cheap deterministic hash. Scatter has to survive being computed twice —
    once for the HTML, again on any rebuild — so `Math.random` is out. `imul`
    keeps this honest 32-bit arithmetic instead of silently losing precision in
    a double.

    The obvious `(col * 7 + row * 13) % n` doesn't work here: with small primes
    and a small modulus it collapses to a function of `row` alone, and the
    "scatter" comes out as horizontal stripes. */
function hash(col: number, row: number) {
  let h = Math.imul(col + 1, 374761393) ^ Math.imul(row + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A true 45° front, travelling left to right and down: every cell on a given
    `col + row` diagonal fires together, then the jitter knocks each one off that
    line by its own amount.

    A plain diagonal, not the loader's chevron. The chevron folds about the middle
    row, so its front is a `>` that meets itself at the centre — legible at 3×3,
    but across 20 columns the two halves read as two separate fronts colliding.
    One diagonal sweep is the same idea with nothing to collide. */
function delayFor(col: number, row: number) {
  const front = (col + row) * STEP;
  const scatter = ((hash(col, row) % 1024) / 1024) * JITTER;
  return Math.round(front + scatter);
}

/** The disc the lattice is clipped to, matching public/logo.svg. Edge cells are
    slivers rather than squares because of it — which is what the mark looks like
    everywhere else on the site, so it stays. A literal id is safe: there is only
    ever one splash on the page. */
const CLIP_ID = "logo-mark-disc";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id={CLIP_ID}>
        <circle cx={VIEWBOX / 2} cy={VIEWBOX / 2} r={VIEWBOX / 2 - 2} />
      </clipPath>

      <g clipPath={`url(#${CLIP_ID})`} fill="currentColor">
        {LOGO_CELLS.map(({ x, y, opacity, col, row }) => (
          <rect
            key={`${col}:${row}`}
            x={x}
            y={y}
            width={CELL}
            height={CELL}
            /* The cell's resting grey, as an attribute — the mark as the rest of
               the site draws it. The wave departs from this and returns to it,
               and with the animation off (reduced motion, or a browser that
               drops it) this is simply the logo. */
            fillOpacity={opacity}
            className="logo-cell"
            style={
              {
                "--cell-ink": opacity,
                animationDelay: `${delayFor(col, row)}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </g>
    </svg>
  );
}
