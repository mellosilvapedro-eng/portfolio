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
            <p className="text-muted">{site.role}</p>
          </div>
          <p className="max-w-prose leading-relaxed text-foreground/80">
            {site.bio}
          </p>
        </header>
        <ThemeToggle />
      </div>

      <section className="animate-rise mt-16" style={{ animationDelay: "80ms" }}>
        <h2 className="mb-2 px-3 text-sm font-medium text-muted">
          Selected work
        </h2>
        <ProjectList projects={publishedProjects} />
      </section>

      <footer
        className="animate-rise mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-20 text-sm text-muted"
        style={{ animationDelay: "160ms" }}
      >
        <FooterLink href={site.links.linkedin}>LinkedIn</FooterLink>
        <FooterLink href={`mailto:${site.email}`}>Email</FooterLink>
        <span className="ml-auto tabular">
          © {new Date().getFullYear()} {site.name}
        </span>
      </footer>
    </main>
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
