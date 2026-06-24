import { ExperimentList } from "@/components/experiment-list";
import { ProjectList } from "@/components/project-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { publishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-20 sm:py-28">
      <div className="flex items-start justify-between gap-4">
        <header className="animate-rise space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-medium tracking-tight">{site.name}</h1>
            <p className="text-muted">
              {site.role}
              <span className="px-1.5 text-border" aria-hidden="true">
                ·
              </span>
              {site.location}
            </p>
          </div>
          <div className="max-w-prose space-y-4 leading-relaxed text-foreground/80">
            {site.bio.map((paragraph) => (
              <p key={paragraph}>{withMentions(paragraph)}</p>
            ))}
          </div>
        </header>
        <ThemeToggle />
      </div>

      <section className="animate-rise mt-16" style={{ animationDelay: "80ms" }}>
        <h2 className="mb-2 px-3 text-sm font-medium text-muted">
          Selected work
        </h2>
        <ProjectList projects={publishedProjects} />
      </section>

      <section className="animate-rise mt-12" style={{ animationDelay: "120ms" }}>
        <h2 className="mb-2 px-3 text-sm font-medium text-muted">
          Experiments
        </h2>
        <ExperimentList />
      </section>

      <footer
        className="animate-rise mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-20 text-sm text-muted"
        style={{ animationDelay: "200ms" }}
      >
        <FooterLink href={site.links.linkedin}>LinkedIn</FooterLink>
        <FooterLink href={site.links.github}>GitHub</FooterLink>
        <FooterLink href={`mailto:${site.email}`}>Email</FooterLink>
        <span className="ml-auto tabular">
          © {new Date().getFullYear()} {site.name}
        </span>
      </footer>
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
        className="text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
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
      className="underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground"
    >
      {children}
    </a>
  );
}
