import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/projects";
import { site } from "@/lib/site";

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-foreground"
      >
        <span
          aria-hidden="true"
          className="transition-transform duration-200 ease-[--ease-out-strong] group-hover:-translate-x-0.5"
        >
          ←
        </span>
        {site.name}
      </Link>

      <article className="animate-rise mt-12">
        <header className="space-y-5">
          <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
            {project.headline}
          </h1>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Meta label="Company">
              {project.url ? (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground"
                >
                  {project.company}
                </a>
              ) : (
                project.company
              )}
            </Meta>
            <Meta label="Role">{project.role}</Meta>
            <Meta label="Year">{project.year}</Meta>
            <Meta label="Status">{project.status}</Meta>
            {project.team ? <Meta label="Team">{project.team}</Meta> : null}
          </dl>
        </header>

        {!project.published ? (
          <p className="mt-10 rounded-lg border border-border px-4 py-3 text-sm text-muted">
            This case study is still a draft.
          </p>
        ) : null}

        <div className="mt-12 space-y-12">
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
                  <span className="mt-0.5 shrink-0 text-sm text-muted tabular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-foreground/80">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Results">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {project.results.map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <dt className="text-3xl font-medium tracking-tight tabular">
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

      <footer className="mt-20 border-t border-border pt-8">
        <Link
          href="/"
          className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
        >
          ← All work
        </Link>
      </footer>
    </main>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted">{label}</dt>
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
