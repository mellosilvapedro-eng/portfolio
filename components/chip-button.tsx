"use client";

/** A 40×40 round chip on the floating-nav surface — used for ← and the theme. */
export function ChipButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="nav-surface grid size-10 shrink-0 place-items-center rounded-full text-[var(--nav-muted)] transition-[color,transform] duration-150 ease-out-strong hover:text-[var(--nav-fg)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-fg)]/25"
    >
      {children}
    </button>
  );
}
