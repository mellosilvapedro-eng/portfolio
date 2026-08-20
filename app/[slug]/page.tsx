import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectMedia } from "@/components/project-media";
import { SiteNav } from "@/components/site-nav";
import { SITE_LINKS } from "@/lib/nav";
import { getProject, projects } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const hasMedia = !!project.media && project.media.length > 0;
  /* The site's own pill, same as every other page. It used to be About /
     Screens — two stops on a page you read top to bottom, which is what
     scrolling is already for. Where you might actually want to go from here is
     the rest of the site, so the bar says that instead, with ← to the timeline
     this case came from and the assistant to ask about it. */
  const nav = [
    ...SITE_LINKS,
    {
      label: "Ask about it",
      ask: `Walk me through your "${project.title}" project at ${project.company}.`,
    },
  ];

  return (
    <main className="min-h-dvh px-6 pb-36 pt-20 sm:pt-[6.5rem]">
      <article
        id="about"
        className="animate-rise mx-auto w-full max-w-[39rem] scroll-mt-24"
      >
        <h1 className="text-balance text-2xl font-medium leading-tight tracking-tight sm:text-[1.875rem]">
          {project.headline}
        </h1>

        {/* Credits run inline under the title and wrap on their own — the four
            short ones share a line and Team drops to the next. */}
        <dl className="mt-12 flex flex-wrap gap-3 text-sm leading-5">
          <Resource label="Company">
            {project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:opacity-70"
              >
                {project.company}
              </a>
            ) : (
              project.company
            )}
          </Resource>
          <Resource label="Role">{project.role}</Resource>
          <Resource label="Year">{project.year}</Resource>
          <Resource label="Status">{project.status}</Resource>
          {project.team ? (
            <Resource label="Team">{project.team}</Resource>
          ) : null}
        </dl>

        <div className="mt-12 space-y-12">
            {!project.published ? (
              <p className="rounded-lg border border-border px-4 py-3 text-sm text-muted">
                This case study is still a draft.
              </p>
            ) : null}

            <Section title="The problem">
              <p>{project.problem}</p>
            </Section>

            <Section title="The solution">
              <p>{project.solution}</p>
            </Section>

            <Section title="Process">
              <ol className="space-y-6">
                {project.process.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    {/* Fixed column so 01/02/03 hang on one edge — the design's
                        numbers are intrinsically sized and drift 2px apart. */}
                    <span className="mt-0.5 w-[18px] shrink-0 text-sm leading-5 text-muted tabular">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-medium leading-[26px] text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-1 leading-[26px] text-foreground/80">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Results">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {project.results.map((metric) => (
                  <div key={metric.label} className="space-y-1">
                    <dt className="text-[30px] font-medium leading-9 tracking-tight text-foreground/80 tabular">
                      {metric.value}
                    </dt>
                    <dd className="text-sm leading-snug text-muted">
                      {metric.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>
        </div>
      </article>

      {hasMedia ? (
        <div id="screens" className="mt-12 scroll-mt-24">
          <ProjectMedia media={project.media} />
        </div>
      ) : null}

      <SiteNav items={nav} back="/" />
    </main>
  );
}

function Resource({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 leading-5">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted">{title}</h2>
      <div className="leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}
