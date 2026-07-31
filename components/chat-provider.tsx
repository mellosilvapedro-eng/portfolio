"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ASK_EVENT } from "@/lib/ask";

/* The assistant is a layer *underneath* the page: a full-height rail pinned to
   the right edge, revealed when the content shell slides off it. Three pieces
   need to agree on whether it's open — the rail itself (components/ai-chat),
   the shell (components/site-shell) and the floating nav (components/site-nav)
   — so the open flag lives here rather than inside the chat. */

type ChatContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used within <ChatProvider>");
  return value;
}

/** Below this the rail can't be docked beside the content, so it covers it. */
export const DOCKED = "(min-width: 1024px)";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Any `pedro:ask` from anywhere on the site springs the panel open; the chat
  // itself listens to the same event for the prompt.
  useEffect(() => {
    const onAsk = () => setOpen(true);
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, []);

  // Undocked, the panel covers the page — lock the scroll behind it. Re-run on
  // breakpoint changes so a resize while open doesn't strand the lock.
  useEffect(() => {
    const mq = window.matchMedia(DOCKED);
    const apply = () => {
      document.body.style.overflow = open && !mq.matches ? "hidden" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes it, wherever focus happens to be.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const value = useMemo(
    () => ({ open, setOpen, toggle: () => setOpen(!open) }),
    [open],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
