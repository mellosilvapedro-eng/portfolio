import { site } from "@/lib/site";

/* Where every top-level page ends: three ways to reach me, then the year,
   pushed to the far edge. `mt-auto` is what holds it to the bottom of short
   pages — /projects is barely a screen tall, and a footer floating in the middle
   of it would read as unfinished rather than as brief. */

export function SiteFooter({
  /** Offset into the page's entrance stagger — the footer is the last thing in. */
  riseDelay = "200ms",
}: {
  riseDelay?: string;
}) {
  return (
    <footer
      className="animate-rise mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-72 text-sm text-muted sm:pt-96"
      style={{ "--rise-delay": riseDelay } as React.CSSProperties}
    >
      <FooterLink href={site.links.linkedin}>LinkedIn</FooterLink>
      <FooterLink href={site.links.github}>GitHub</FooterLink>
      <FooterLink href={`mailto:${site.email}`}>Email</FooterLink>
      <span className="ml-auto tabular">
        © {new Date().getFullYear()} {site.name}
      </span>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link hover:text-foreground"
    >
      {children}
    </a>
  );
}
