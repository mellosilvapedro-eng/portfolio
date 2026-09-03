import { LinkRow } from "@/components/link-row";
import { site } from "@/lib/site";

/* The experiments on /projects. Same row as home's Selected work — see
   components/link-row — with a description trailing the name instead of a bare
   title. */

export function ExperimentList() {
  return (
    <ul className="-mx-3">
      {site.experiments.map((experiment) => (
        <li key={experiment.url}>
          <LinkRow href={experiment.url} meta={experiment.year}>
            <span className="text-foreground">{experiment.name}</span>
            <span className="text-muted">{experiment.description}</span>
          </LinkRow>
        </li>
      ))}
    </ul>
  );
}
