/* ────────────────────────────────────────────────────────────────────────
   The assistant's mark — a sparkle, drawn as an outline, lit from inside.

   It replaces the 3×3 pixel field that used to stand in for the assistant in
   the nav and on the selection pill. The grid was a good loader and a vague
   icon: it said "something is computing", which is what you want while the
   chat is thinking and not what you want on a button that has to say "ask a
   question" at 18px, cold, next to three text links. A sparkle says it
   without a label. The pixel field keeps the job it was always best at — the
   thinking state in the rail (components/loading-state).

   The shape is `public/spark.svg`, exported from Figma untouched, and it is
   used as a **mask** rather than drawn: the glyph punches the hole and the
   paint that shows through belongs to this stylesheet (`.spark-mark` in
   globals.css). Two things fall out of that, both of them the point — the
   ramp inside the stroke follows `currentColor`, so the mark is ink on the
   light chip and near-white on the dark one from one file; and it can move.
   It does, continuously and slowly: the nav is a row of static links, and one
   thing already breathing is what points at it.
   ──────────────────────────────────────────────────────────────────────── */

export function SparkMark({ className }: { className?: string }) {
  /* Size and colour come from the caller — the mark is 18px in the nav's 48px
     chip and 15px on the selection pill, and it takes its two gradient stops
     from whatever `color` is in force on the surface it lands on. */
  return <span aria-hidden className={`spark-mark ${className ?? ""}`} />;
}
