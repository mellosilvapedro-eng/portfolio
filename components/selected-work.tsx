import { CasePreview, CasePreviewDeck } from "@/components/case-preview";
import { LinkRow } from "@/components/link-row";
import { previewMedia, publishedProjects } from "@/lib/projects";

/* The case studies, as a section of their own again.

   They spent a while hanging off the jobs in the timeline below — each case
   filed under the company it came out of — which read well but filed the work
   inside the CV, so the first thing on the page was a career rather than what
   came out of it. The design splits them: the cases first, then the career
   underneath.

   Two things follow from the split. The year comes back onto the row, because
   the rail's period is no longer overhead to date it; and the company leaves
   the row entirely, because it's one section down, on the entry the case came
   out of. Nothing here reads `job.company` any more — `publishedProjects` is
   the whole list, in the order lib/projects authors it. That order is the data's
   rather than a sort here: the run is short enough to read as deliberate, and
   the two 2025 cases would otherwise be ordered by whatever a sort happens to
   be stable on. */

export function SelectedWork() {
  return (
    /* The deck owns one preview card for the whole list, which is what lets the
       picture change from row to row instead of the card closing and reopening
       (components/case-preview). It renders no element of its own, so the <ul>
       below is still the list's outermost box. */
    <CasePreviewDeck>
      {/* Pulled flush by the row's own padding, so the titles line up with the
          heading above them and the hover field still extends past the text. */}
      <ul className="-mx-3">
        {publishedProjects.map((project) => (
          <li key={project.slug}>
            {/* The row is the link; what the card shows while you point at it
                is the case's own first piece of media, so the list shows what
                it's pointing at. */}
            <CasePreview item={previewMedia(project)}>
              <LinkRow href={`/${project.slug}`} meta={project.year}>
                <span className="text-foreground">{project.title}</span>
              </LinkRow>
            </CasePreview>
          </li>
        ))}
      </ul>
    </CasePreviewDeck>
  );
}
