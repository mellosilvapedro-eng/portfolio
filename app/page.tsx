import { ExperienceList } from "@/components/experience-list";
import { ExperimentList } from "@/components/experiment-list";
import { ProjectList } from "@/components/project-list";
import { SiteNav } from "@/components/site-nav";
import { publishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";

const NAV = [
  { label: "About", target: "about" },
  { label: "Work", target: "work" },
  { label: "Ask me anything", ask: true as const },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 pb-36 pt-20 sm:pt-28">
      <header id="about" className="animate-rise scroll-mt-24 space-y-4">
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

      <section
        id="experience"
        className="animate-rise mt-16 scroll-mt-24"
        style={{ animationDelay: "60ms" }}
      >
        <h2 className="mb-6 text-sm font-medium text-muted">Experience</h2>
        <ExperienceList />
      </section>

      <section
        id="work"
        className="animate-rise mt-16 scroll-mt-24"
        style={{ animationDelay: "100ms" }}
      >
        <h2 className="mb-2 text-sm font-medium text-muted">Selected work</h2>
        <ProjectList projects={publishedProjects} />
      </section>

      <section
        className="animate-rise mt-16"
        style={{ animationDelay: "140ms" }}
      >
        <h2 className="mb-2 text-sm font-medium text-muted">Experiments</h2>
        <ExperimentList />
      </section>

      <footer
        className="animate-rise mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-24 text-sm text-muted sm:pt-[100px]"
        style={{ animationDelay: "200ms" }}
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
