/* ────────────────────────────────────────────────────────────────────────
   The assistant's thinking state — a 3×3 pixel field.

   It's the loader that holds the gap before the first token.

   It used to be the nav's assistant button too, on the argument that the thing
   you press and the thing that answers should read as one object. The button
   carries the sparkle now (components/spark-mark) — a mark has to name the
   thing it opens, and a field of blinking pixels names *computing*, which is
   the answer to "what is it doing", not to "what is this". So the grid keeps
   the question it was always answering.

   The keyframes (`pixel-on`) and the wave utility (`animate-pixel`) live in
   globals.css, which is also where reduced motion freezes them.
   ──────────────────────────────────────────────────────────────────────── */

/** Cells on the same diagonal light together, so the front reads as a chevron
    travelling right rather than a column sweep. */
export const CHEVRON = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return (col + Math.abs(row - 1)) * 90;
});

/** Perimeter, clockwise from the top-left. The centre cell never lights. */
const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
export const ORBIT = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

export function PixelGrid({
  delays = CHEVRON,
  duration = 650,
  round = false,
  color = "bg-foreground",
}: {
  /** Per-cell offset into the wave, in ms. `null` keeps a cell dark. */
  delays?: (number | null)[];
  /** One pass of the wave. Shorter than the sweep is deliberate — it keeps two
      fronts in flight, so the grid never reads as empty mid-animation. */
  duration?: number;
  round?: boolean;
  /** Tailwind colour utility for the cells — the page's ink unless the surface
      the loader lands on runs its own scale. */
  color?: string;
}) {
  return (
    <span aria-hidden className="grid grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.map((delay, i) => (
        <span
          key={i}
          className={`size-1 ${color} ${round ? "rounded-full" : "rounded-[1px]"} ${
            delay === null ? "" : "animate-pixel"
          }`}
          style={{
            opacity: delay === null ? 0.07 : 0.15,
            animationDuration: `${duration}ms`,
            animationDelay: `${delay ?? 0}ms`,
          }}
        />
      ))}
    </span>
  );
}
