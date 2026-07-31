"use client";

import { useChat } from "@/components/chat-provider";

/**
 * The page content, as a card floating over the assistant rail.
 *
 * When the chat opens on a docked viewport the shell gives up 24rem on the
 * right — it doesn't get covered — so the rail is revealed rather than
 * overlaid. Undocked, the rail becomes a sheet on top and the shell stays put.
 *
 * The shell's *surface* is a fixed layer, separate from the scrolling content.
 * That's what keeps its rounded right edge pinned to the top and bottom of the
 * viewport at every scroll position — which is the whole point of the corner:
 * it's what tells you the content is a card on top of something. Rounding the
 * scrolling block instead would round the top and bottom of the *document*, so
 * the corner would be gone one screen down.
 *
 * Deliberately not a `@container`: inline-size containment would make this the
 * containing block for the fixed nav inside it. Pages that need to measure the
 * shell open their own container further in.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const { open } = useChat();

  return (
    <>
      {/* The painted surface. Sits at z-0 like the rail but after it in source
          order, so when the chat is closed it simply covers the rail.
          `sm` on the elevation ladder — the rail is one step below the shell,
          not a popover above the page. The design only darkens the seam from
          #151515 to #131313, so the shadow seats the edge and nothing more. */}
      {/* `border-radius` is deliberately not in the transition list: animating
          it promotes this to a composited layer and Chrome then fails to
          repaint the small bottom corner, leaving the edge square below the
          fold. It snaps instead, which is invisible under a 500ms slide. */}
      <div
        aria-hidden="true"
        className={`fixed inset-y-0 left-0 z-0 bg-background transition-[right,box-shadow] duration-500 ease-drawer ${
          open
            ? "right-0 lg:right-96 lg:rounded-r-2xl lg:shadow-[1px_0_2px_rgba(17,17,24,0.05),2px_0_8px_rgba(17,17,24,0.07)] lg:dark:shadow-[2px_0_8px_rgba(0,0,0,0.4)]"
            : "right-0"
        }`}
      />

      <div
        className={`relative z-10 min-h-dvh transition-[margin-right] duration-500 ease-drawer ${
          open ? "lg:mr-96" : ""
        }`}
      >
        {children}
      </div>
    </>
  );
}
