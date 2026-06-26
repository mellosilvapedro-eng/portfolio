import Link from "next/link";
import { site } from "@/lib/site";

const rowClass =
  "group flex items-baseline justify-between gap-6 rounded-lg px-3 py-3.5 transition-colors duration-150 hover:bg-hover focus-visible:bg-hover focus-visible:outline-none";

export function ExperimentList() {
  return (
    <ul className="-mx-3">
      {site.experiments.map((experiment) => {
        const isInternal = experiment.url.startsWith("/");
        const content = (
          <>
            <span className="flex items-baseline gap-2 leading-snug">
              <span className="flex items-baseline gap-2 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5">
                <span className="text-foreground">{experiment.name}</span>
                <span className="text-muted">{experiment.description}</span>
              </span>
              <span
                aria-hidden="true"
                className="-translate-x-1 text-muted opacity-0 transition duration-200 ease-out-strong group-hover:translate-x-0 group-hover:opacity-100"
              >
                ↗
              </span>
            </span>
            <span className="shrink-0 text-sm text-muted tabular">
              {experiment.year}
            </span>
          </>
        );

        return (
          <li key={experiment.url}>
            {isInternal ? (
              <Link href={experiment.url} className={rowClass}>
                {content}
              </Link>
            ) : (
              <a
                href={experiment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={rowClass}
              >
                {content}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
