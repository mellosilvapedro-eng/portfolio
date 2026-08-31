/* ────────────────────────────────────────────────────────────────────────
   The assistant's mark in the corner — a robot, and it blinks.

   It took the corner from the sparkle, and the swap is a division of labour
   rather than a change of taste. The sparkle now means "answer this about the
   thing in front of you": it's on the selection pill and on a case study's
   Summarize button, both of which arrive carrying a prompt. The corner never
   did — since Summarize exists, the corner's only job is to open the
   conversation, and a robot says *assistant* where a sparkle says *do something
   clever with this*.

   Drawn here rather than masked from a file the way its sibling is
   (components/spark-mark), and the blink is the reason. A mask is one alpha
   channel: the glyph is a hole and everything inside it moves together, which
   is exactly what the sparkle wants — a gradient sliding under a fixed shape.
   Eyes can't be done that way. They have to be their own geometry to close on
   their own.

   What that costs is the sweep. The sparkle is lit from a moving gradient, and
   this could have been too — but a 20px glyph running a gradient sweep *and* a
   blink is two idle animations competing in a corner whose job is to be quiet
   until pointed at. The blink is the better one to keep: same job (one thing
   breathing on a still page, so the corner reads as live rather than as
   furniture) done by something that actually looks alive.

   ── Why it's stroked and not filled ──────────────────────────────────────

   The design's icon is filled geometry whose shape happens to be an outline:
   an outer boundary and an inner one, 1.5 units apart, with the wall as the
   space between them. Pasting that in worked and looked wrong, and measuring
   said why. Absolute stroke weights across this site run 1.5–1.75px — the chat
   rail's icons, the theme toggle, the back arrow — and the filled robot's wall
   came to 1.63px, right in the middle. But it renders at 20px where those run
   11–16px, so as a *fraction of its own glyph* it was 8.2% against their
   10–13.6%, which made it the finest-lined icon on the site, sitting diagonally
   opposite the chunkiest one. Icons read as one family by that ratio, not by
   absolute px, across a size range this wide.

   Filled geometry gives you no way to fix that — the wall is baked into two
   boundaries, and thickening it means moving the inner one and re-deriving
   every curve. So the glyph is rebuilt on its centerlines, where weight is a
   single number. The centerlines come from the original's own boundaries
   (midway between outer and inner) scaled from an 18 to a 24 viewBox:

     head      outer 2.25→15.75 / inner 3.75→14.25  →  centre rect 3,6 12×9 r1.5  →  4,8 16×12 r2
     antenna   bar at x≈9 from y 2.25→5.25, arm y=3 from x 6→9  →  M8 4 H12 V8
     eyes      bars x 6.75 / 11.25, y 9→12          →  lines x 9 / 15, y 13→15

   Round caps and joins, because every other stroked icon in this codebase has
   them. `strokeWidth` 2.5 at this viewBox is 2.08px on a 20px glyph — 10.4%,
   which lands on the chat rail's 10% and inside the family.
   ──────────────────────────────────────────────────────────────────────── */

export function RobotMark({ className }: { className?: string }) {
  /* Size and colour come from the caller, as with the sparkle — it takes its
     stroke from whatever `color` is in force on the surface it lands on. */
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head. `rx` is the original's centerline radius, not either boundary's. */}
      <rect x="4" y="8" width="16" height="12" rx="2" />
      {/* Antenna: the arm, then down into the head. One path so the corner is
          a single round join rather than two caps meeting at a seam. */}
      <path d="M8 4h4v4" />
      {/* One group, not two paths animated apart: a blink is both eyes at once,
          and scaling the pair about the group's own centre is one transform
          instead of two that could drift out of step. `transform-box: fill-box`
          (set in globals.css) is what makes `transform-origin: center` mean the
          eyes' bounding box rather than the whole SVG viewport — without it the
          eyes would squash toward the canvas corner. */}
      <g className="robot-eyes">
        <path d="M9 13v2" />
        <path d="M15 13v2" />
      </g>
    </svg>
  );
}
