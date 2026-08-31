/* Bridge from anywhere in the UI to the floating assistant (components/ai-chat).

   Two channels, because there are two kinds of ask.

   `pedro:ask` carries a finished question. A CTA that knows exactly what it
   wants asked — Summarize on a case study (components/case-meta) — fires it,
   and the chat springs open and answers in a fresh thread. Nothing to type.

   `pedro:quote` carries a passage the visitor highlighted and no question at
   all. The chat opens with the quote attached to its composer and waits: the
   person who just read the line is the one who knows what they want to know
   about it, and a highlight is the start of a question, not the whole of one.

   Kept as tiny custom-event contracts so callers don't need the chat's state
   lifted into a context provider. */

export const ASK_EVENT = "pedro:ask";
export const QUOTE_EVENT = "pedro:quote";

export type AskDetail = { prompt: string };

/** A passage from the page, plus the name of the page it came from — half the
    lines worth highlighting are too short to identify themselves ("measured,
    not guessed"), so the source is what gives the answer somewhere to land. */
export type Quote = { text: string; source: string };

export type QuoteDetail = { quote: Quote };

/** Open the assistant and ask it something. No-op during SSR. */
export function askPedro(prompt: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AskDetail>(ASK_EVENT, { detail: { prompt } }),
  );
}

/** Open the assistant with a passage attached, and leave the question to the
    visitor. No-op during SSR. */
export function quotePedro(quote: Quote) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<QuoteDetail>(QUOTE_EVENT, { detail: { quote } }),
  );
}
