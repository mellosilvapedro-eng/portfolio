import { site } from "@/lib/site";

/* The opening of every top-level page: the mark, the name, the one-line
   identity, then whatever that page is about.

   It lives in one place because the site now has more than one front door.
   Home opens on the career, /projects opens on the experiments — same masthead,
   different copy under it, so arriving on either reads as the same site rather
   than two pages that happen to share a typeface. */

export function SiteHeader({
  bio,
  /** Distance from the identity block down to the first line of copy. The
      design opens home with a long drop (64px) — the bio is a second beat after
      the name — and runs the projects copy right under it (24px), because there
      the copy IS the introduction. */
  bioOffset = "mt-16",
  children,
}: {
  bio: readonly string[];
  bioOffset?: string;
  /** Rendered inside each paragraph — home links the companies it mentions. */
  children?: (paragraph: string) => React.ReactNode;
}) {
  return (
    <header id="about" className="animate-rise scroll-mt-24">
      <Mark />
      <div className="mt-4 space-y-1">
        <h1 className="text-lg font-medium tracking-tight">{site.name}</h1>
        <p className="text-muted">
          {site.role}
          <span className="px-1.5 text-border" aria-hidden="true">
            ·
          </span>
          {site.location}
        </p>
      </div>
      <div
        className={`${bioOffset} max-w-prose space-y-4 leading-relaxed text-foreground/80`}
      >
        {bio.map((paragraph) => (
          <p key={paragraph}>{children ? children(paragraph) : paragraph}</p>
        ))}
      </div>
    </header>
  );
}

/* Opens the page: the same dithered orb that serves as the favicon and as the
   assistant's avatar, so the mark you see in the tab is the one at the top of
   the page. The 32px box and its 7px radius are baked into the file.
   The art is drawn for dark grounds (a light orb on a near-black square), so it
   sits native in dark mode and inverts in light — matching how the chat renders
   it. */
function Mark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static /public SVG; matches the site's existing <img> convention (no next/image)
    <img
      src="/logo.svg"
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      draggable={false}
      className="size-8 select-none invert dark:invert-0"
    />
  );
}
