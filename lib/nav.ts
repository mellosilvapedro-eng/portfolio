/* The shape of the floating bar's items, and the site's own three destinations.

   This is a plain module rather than part of components/site-nav on purpose:
   site-nav is `"use client"`, and a non-component export crossing that boundary
   comes out the other side as a client *reference*, not as the value — so a
   server component spreading `SITE_LINKS` got "not iterable" at render. The data
   lives here, where both sides can read it; the component stays a component. */

export type NavItem = {
  label: string;
  /** Route this item navigates to (a pill tab). */
  href?: string;
  /** Opens the assistant. Items marked this way leave the pill and become the
      trailing corner button — their `label` is the copy it posts on hover, so it
      changes with what the page can be asked about.

      A flag rather than a prompt: it used to accept a string to ask on click,
      which made one glyph behave differently per page. Asking a specific
      question is now the case page's own Summarize button. */
  ask?: true;
};

/** The site's three destinations, in the order the design has them. Every
    top-level page spreads this same array into its own nav, so the pill is one
    control that survives the navigation instead of three that look alike. */
export const SITE_LINKS: readonly NavItem[] = [
  { label: "Work", href: "/" },
  { label: "Skills", href: "/skills" },
  { label: "Projects", href: "/projects" },
];
