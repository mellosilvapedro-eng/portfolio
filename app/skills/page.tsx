import type { Metadata } from "next";
import { CopyButton } from "@/components/copy-button";
import { SiteNav } from "@/components/site-nav";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Agent skills that encode how I design — install them into Claude Code, Cursor, or any agent that supports the skills.sh CLI.",
};

const REPO = "mellosilvapedro-eng/skills";
const REPO_URL = `https://github.com/${REPO}`;

const NAV = [
  { label: "About", target: "about" },
  { label: "Ask me anything", ask: true as const },
];

const skills = [
  { name: "design-taste", description: "Design judgment for any interface." },
  { name: "lp-builder", description: "Landing pages that convert." },
  { name: "css-animations-hover", description: "Motion and hover that feel right." },
];

export default function SkillsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 pb-36 pt-20 sm:pt-28">
      <header id="about" className="animate-rise scroll-mt-24 space-y-4">
        <div className="space-y-1">
          <h1 className="text-lg font-medium tracking-tight">Skills</h1>
          <p className="text-muted">Agent skills for interfaces that feel right</p>
        </div>
        <div className="max-w-prose leading-relaxed text-foreground/80">
          <p>
            Agent skills that give your AI coding agent design taste — the
            judgment to build interfaces that feel considered, not generic.
            Install them and they shape the UI, motion, and landing pages it
            produces. Drawn from my work on SpecNote, Paste, and this site.
          </p>
        </div>
      </header>

      <section className="animate-rise mt-14" style={{ animationDelay: "80ms" }}>
        <h2 className="mb-2 text-sm font-medium text-muted">Install everything</h2>
        <CopyButton text={`npx skills add ${REPO}`} />
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Drops all three skills into your agent&rsquo;s skills directory. Works
          with Claude Code, Cursor, Codex, and any other agent the{" "}
          <a
            href="https://skills.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-foreground"
          >
            skills.sh
          </a>{" "}
          CLI supports.
        </p>
      </section>

      <section className="animate-rise mt-10" style={{ animationDelay: "120ms" }}>
        <h2 className="mb-3 text-sm font-medium text-muted">
          Or install one at a time
        </h2>
        <ul className="space-y-5">
          {skills.map((skill) => (
            <li key={skill.name} className="space-y-2">
              <div className="space-y-0.5">
                <a
                  href={`${REPO_URL}/blob/main/skills/${skill.name}/SKILL.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-baseline gap-1.5 font-medium leading-snug"
                >
                  <span className="transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5">
                    {skill.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="-translate-x-1 text-muted opacity-0 transition duration-200 ease-out-strong group-hover:translate-x-0 group-hover:opacity-100"
                  >
                    ↗
                  </span>
                </a>
                <p className="text-sm text-muted">{skill.description}</p>
              </div>
              <CopyButton text={`npx skills add ${REPO} --skill ${skill.name}`} />
            </li>
          ))}
        </ul>
      </section>

      <footer
        className="animate-rise mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-32 text-sm text-muted sm:pt-40"
        style={{ animationDelay: "200ms" }}
      >
        <FooterLink href={REPO_URL}>GitHub</FooterLink>
        <FooterLink href="https://skills.sh">skills.sh</FooterLink>
        <span className="ml-auto tabular">
          © {new Date().getFullYear()} {site.name}
        </span>
      </footer>

      <SiteNav items={NAV} back="/" />
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
      className="text-link hover:text-foreground"
    >
      {children}
    </a>
  );
}
