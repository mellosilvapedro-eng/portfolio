import { site } from "@/lib/site";

/* Career history: a period column against the role and a one-line summary.
   The two columns collapse into a stack below sm, where 120px of gutter would
   leave the description too narrow to read. */
export function ExperienceList() {
  return (
    <ol className="space-y-9 sm:space-y-11">
      {site.experience.map((job) => (
        <li
          key={`${job.company}-${job.period}`}
          className="flex flex-col gap-1 sm:flex-row sm:gap-5"
        >
          <span className="shrink-0 text-sm leading-[1.8] text-foreground/60 sm:w-[7.5rem] tabular">
            {job.period}
          </span>
          <div className="min-w-0 max-w-[28.75rem]">
            <h3 className="text-sm leading-[1.8] text-foreground">
              {job.role} at{" "}
              {job.url ? (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:opacity-70"
                >
                  {job.company}
                </a>
              ) : (
                job.company
              )}
            </h3>
            <p className="text-sm leading-[1.6] text-foreground/60">
              {job.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
