import Link from "next/link";

/* The row both of the site's lists are made of: something on the left, its year
   on the right, a hover field wider than the text it holds, and an arrow that
   arrives with the fill.

   One component because the design gives the two lists the identical row — the
   cases on home and the experiments on /projects — and they were drifting while
   each carried its own copy of the classes. What the row does *not* own is the
   flush pull that lines the text up with the column above it: `-mx-3` is a
   property of the list against its column, so the list keeps it.

   `href` picks the element rather than a prop: an in-site route gets next/link
   so the case pages prefetch, anything else is an <a> to a new tab. */

const ROW =
  "group flex items-baseline justify-between gap-6 rounded-lg px-3 py-3.5 transition-colors duration-150 hover:bg-hover focus-visible:bg-hover focus-visible:outline-none";

export function LinkRow({
  href,
  meta,
  children,
}: {
  href: string;
  /** The right-hand column. The year, in both lists that use this. */
  meta?: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      {/* The nudge is on this inner span, not on the row: the row is the hover
          field and has to hold still while its contents shift inside it. */}
      <span className="flex items-baseline gap-2 leading-snug">
        <span className="flex items-baseline gap-2 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="-translate-x-1 text-muted opacity-0 transition duration-200 ease-out-strong group-hover:translate-x-0 group-hover:opacity-100"
        >
          ↗
        </span>
      </span>
      {meta ? (
        <span className="shrink-0 text-sm text-muted tabular">{meta}</span>
      ) : null}
    </>
  );

  return href.startsWith("/") ? (
    <Link href={href} className={ROW}>
      {content}
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={ROW}
    >
      {content}
    </a>
  );
}
