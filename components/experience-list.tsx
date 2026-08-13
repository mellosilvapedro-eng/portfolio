import { site } from "@/lib/site";

/* Career history: a period column against the role and a one-line summary.
   The two columns collapse into a stack below sm, where 120px of gutter would
   leave the description too narrow to read.

   Set at the body's 16px, not the 14px small copy it used to be: this is the
   longest read on the page after the intro, and dropping a size made it look
   like metadata about the page rather than part of it. The role gets the looser
   1.575 line so it sits as a heading; the summary tightens to 1.4 so its two
   lines bind together and stay clearly subordinate. */
export function ExperienceList() {
  return (
    <ol className="space-y-9 sm:space-y-11">
      {site.experience.map((job) => (
        <li
          key={`${job.company}-${job.period}`}
          className="flex flex-col gap-1 sm:flex-row sm:gap-5"
        >
          <span className="shrink-0 leading-[1.575] text-foreground/65 sm:w-[7.5rem] tabular">
            {job.period}
          </span>
          <div className="min-w-0 max-w-[28.75rem]">
            <h3 className="pb-1 leading-[1.575] text-foreground">
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
            <p className="leading-[1.4] text-foreground/65">
              {job.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
