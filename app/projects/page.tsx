import type { Metadata } from "next";
import { ExperimentList } from "@/components/experiment-list";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteNav } from "@/components/site-nav";
import { SITE_LINKS } from "@/lib/nav";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Projects",
  description: site.projectsIntro[0],
};

const NAV = [...SITE_LINKS, { label: "Ask agent", ask: true as const }];

/* The experiments, moved off home and given their own front door.

   Same masthead as home, different copy under it — and the copy sits right
   beneath the name here (24px, not home's 64px) because on this page it *is*
   the introduction rather than a second beat after it. Then one heading and the
   list, and that's the whole page: it's short on purpose, so the footer is held
   down by `mt-auto` rather than left floating mid-screen. */
export default function ProjectsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 pb-36 pt-20 sm:pt-28">
      <SiteHeader bio={site.projectsIntro} bioOffset="mt-6" />

      <section
        id="experiments"
        className="animate-rise mt-24 scroll-mt-24"
        style={{ "--rise-delay": "80ms" } as React.CSSProperties}
      >
        <h2 className="mb-2 text-sm font-medium text-muted">Experiments</h2>
        <ExperimentList />
      </section>

      <SiteFooter riseDelay="140ms" />

      <SiteNav items={NAV} />
    </main>
  );
}
