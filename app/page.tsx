import { CareerTimeline } from "@/components/career-timeline";
import { ExperimentList } from "@/components/experiment-list";
import { SiteNav } from "@/components/site-nav";
import { SplashScreen } from "@/components/splash-screen";
import { site } from "@/lib/site";

/* Two stops, as the design has it: the top, and the end. "Work" used to be the
   second one, back when work was its own section — now that it's merged into the
   timeline the page reads About → the career → Experiments, and the timeline is
   simply what you scroll through between the two. The `work` id stays on it for
   deep links. */
const NAV = [
  { label: "About", target: "about" },
  { label: "Experiments", target: "experiments" },
  { label: "Ask anything", ask: true as const },
];

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
        <div className="mt-6 max-w-prose space-y-4 leading-relaxed text-foreground/80">
          {site.bio.map((paragraph) => (
            <p key={paragraph}>{withMentions(paragraph)}</p>
          ))}
        </div>
      </header>

      {/* One section, not two. Career history and the case studies were separate
          lists reading off the same companies; each case now hangs off the job
          it came out of. */}
      <section
        id="work"
        className="animate-rise mt-16 scroll-mt-24"
        style={{ "--rise-delay": "60ms" } as React.CSSProperties}
      >
        <h2 className="mb-6 text-sm font-medium text-muted">
          Experience & Work
        </h2>
        <CareerTimeline />
      </section>

      <section
        id="experiments"
        className="animate-rise mt-16 scroll-mt-24"
        style={{ "--rise-delay": "140ms" } as React.CSSProperties}
      >
        <h2 className="mb-2 text-sm font-medium text-muted">Experiments</h2>
        <ExperimentList />
      </section>

      <footer
        className="animate-rise mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-24 text-sm text-muted sm:pt-[100px]"
        style={{ "--rise-delay": "200ms" } as React.CSSProperties}
      >
        <FooterLink href={site.links.linkedin}>LinkedIn</FooterLink>
        <FooterLink href={site.links.github}>GitHub</FooterLink>
        <FooterLink href={`mailto:${site.email}`}>Email</FooterLink>
        <span className="ml-auto tabular">
          © {new Date().getFullYear()} {site.name}
        </span>
      </footer>

      <SiteNav items={NAV} />
    </main>
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
