import { CareerTimeline } from "@/components/career-timeline";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteNav } from "@/components/site-nav";
import { SplashScreen } from "@/components/splash-screen";
import { SITE_LINKS } from "@/lib/nav";
import { site } from "@/lib/site";

/* Home is the Work page now. The nav below it is the site's, not this page's —
   the pill switches routes rather than scrolling to sections, so there's nothing
   here to point at but the career itself, and the experiments moved out to
   /projects where they get their own opening. */
const NAV = [...SITE_LINKS, { label: "Ask anything", ask: true as const }];

export default function Home() {
  return (
    <>
      {/* The opening, and it lives here rather than in the root layout for two
          reasons: this is the only route that gets it, and the layout renders on
          every route. It's `position: fixed`, so being inside the page's tree
          costs it nothing — it still covers the viewport, and at z-70 it sits
          over everything the shell stacks beneath it (nav at 40, toggle at 30).
          The assistant's rail is the only thing above the shell at all, and it's
          `invisible` until opened. */}
      <SplashScreen />

      <HomeContent />
    </>
  );
}

function HomeContent() {
  return (
    /* `splash-page` is what confines the opening's content offset to this page.
       The delay has to be scoped by *place* as well as by time, or navigating
       from here to /skills inherits it and that page waits two seconds for a
       cover it never had. See globals.css. */
    <main className="splash-page mx-auto flex min-h-dvh max-w-2xl flex-col px-6 pb-36 pt-20 sm:pt-28">
      <SiteHeader bio={site.bio}>{withMentions}</SiteHeader>

      {/* One section, not two. Career history and the case studies were separate
          lists reading off the same companies; each case now hangs off the job
          it came out of. */}
      <section
        id="work"
        className="animate-rise mt-24 scroll-mt-24"
        style={{ "--rise-delay": "60ms" } as React.CSSProperties}
      >
        <h2 className="mb-8 text-sm font-medium text-muted">
          Experience & Work
        </h2>
        <CareerTimeline />
      </section>

      <SiteFooter />

      <SiteNav items={NAV} />
    </main>
  );
}

function withMentions(text: string) {
  const names = Object.keys(site.mentions);
  if (names.length === 0) return text;
  const pattern = new RegExp(`(${names.join("|")})`, "g");
  return text.split(pattern).map((part, i) =>
    site.mentions[part] ? (
      <a
        key={i}
        href={site.mentions[part]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link text-foreground hover:opacity-70"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}
