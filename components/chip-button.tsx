"use client";

/** A 48×48 round chip on the floating-nav surface — used for ← and the theme.
    Matches the pill's height, so the bar reads as one row of equal weights. */
export function ChipButton({
  label,
  onClick,
  className = "",
  children,
}: {
  label: string;
  onClick: () => void;
  /** Where the chip sits in the row — the nav uses it to drop ← on the
      narrowest viewports. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`nav-surface grid size-12 shrink-0 place-items-center rounded-full text-[var(--nav-muted)] transition-[color,transform] duration-150 ease-out-strong hover:text-[var(--nav-fg)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25 ${className}`}
    >
      {children}
    </button>
  );
}
