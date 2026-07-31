/* Bridge from anywhere in the UI to the floating assistant (components/ai-chat).
   A CTA dispatches `pedro:ask` with a prompt; the chat widget listens, springs
   open, and answers it in a fresh thread. Kept as a tiny custom-event contract
   so callers don't need the chat's state lifted into a context provider. */

export const ASK_EVENT = "pedro:ask";

export type AskDetail = { prompt: string };

/** Open the assistant and ask it something. No-op during SSR. */
export function askPedro(prompt: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AskDetail>(ASK_EVENT, { detail: { prompt } }),
  );
}
