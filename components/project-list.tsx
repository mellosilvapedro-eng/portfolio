import Link from "next/link";
import type { Project } from "@/lib/projects";

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul className="-mx-3">
      {projects.map((project) => (
        <li key={project.slug}>
          <Link
            href={`/${project.slug}`}
            className="group flex items-baseline justify-between gap-6 rounded-lg px-3 py-3.5 transition-colors duration-150 hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
          >
            <span className="flex items-baseline gap-2 leading-snug">
              <span className="text-foreground transition-transform duration-200 ease-[--ease-out-strong] group-hover:translate-x-0.5">
                {project.title}
              </span>
              <span
                aria-hidden="true"
                className="-translate-x-1 text-muted opacity-0 transition-all duration-200 ease-[--ease-out-strong] group-hover:translate-x-0 group-hover:opacity-100"
              >
                ↗
              </span>
            </span>
            <span className="shrink-0 text-sm text-muted tabular">
              {project.year}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
