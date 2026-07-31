"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import Link from "next/link";
import { useChat } from "@/components/chat-provider";
import { site } from "@/lib/site";
import { publishedProjects } from "@/lib/projects";
import { ASK_EVENT, type AskDetail } from "@/lib/ask";

/* ────────────────────────────────────────────────────────────────────────
   Conversation model — an agent session of semantic activities.
   The user's message is a `prompt`; Pedro answers with a streamed `response`.
   State is derived from the activities, not managed by hand.
   ──────────────────────────────────────────────────────────────────────── */

type Content =
  | { type: "prompt"; body: string }
  | { type: "response"; text: string; streaming?: boolean }
  | { type: "error"; body: string };

type Activity = { id: string; createdAt: number; content: Content };
type Session = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  activities: Activity[];
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const uid = () => Math.random().toString(36).slice(2);
const act = (content: Content): Activity => ({
  id: uid(),
  createdAt: Date.now(),
  content,
});
const truncate = (s: string) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > 38 ? t.slice(0, 38) + "…" : t;
};

const SUGGESTIONS = [
  "What did you work on at Jusbrasil?",
  "How do you approach monetization design?",
  "What's your design philosophy?",
];

/* ────────────────────────────────────────────────────────────────────────
   Inline case-study link cards.
   Pedro's answers can recommend a case study by embedding a token like
   `[[case:device-control]]`. We split the streamed text on those tokens and
   render each as a clickable card linking to `/slug`. The token syntax and the
   list of valid slugs are taught to the model in lib/persona.ts.
   ──────────────────────────────────────────────────────────────────────── */

const PROJECTS_BY_SLUG = new Map(publishedProjects.map((p) => [p.slug, p]));
const CASE_TOKEN = /\[\[case:([a-z0-9-]+)\]\]/g;

type Segment = { kind: "text"; text: string } | { kind: "case"; slug: string };

function parseSegments(text: string, streaming: boolean): Segment[] {
  let body = text;
  // While tokens are still arriving, hide a half-typed "[[case:dev…" so the raw
  // token never flashes before its closing "]]" lands.
  if (streaming) {
    const open = body.lastIndexOf("[[");
    if (open !== -1 && body.indexOf("]]", open) === -1) body = body.slice(0, open);
  }

  const segments: Segment[] = [];
  let last = 0;
  // Trim only the newlines that hug a card boundary so the card sits in its own
  // block without leaving the blank lines the model put around the token.
  const push = (raw: string) => {
    const t = raw.replace(/^\n+/, "").replace(/\n+$/, "");
    if (t) segments.push({ kind: "text", text: t });
  };
  for (const m of body.matchAll(CASE_TOKEN)) {
    const idx = m.index ?? 0;
    push(body.slice(last, idx));
    segments.push({ kind: "case", slug: m[1] });
    last = idx + m[0].length;
  }
  push(body.slice(last));
  return segments;
}

const stripTokens = (s: string) =>
  s.replace(CASE_TOKEN, "").replace(/\n{3,}/g, "\n\n").trim();

/* ────────────────────────────────────────────────────────────────────────
   Inline markdown.
   Pedro's answers come back as plain text but the model still reaches for
   `**emphasis**`, and rendering it raw leaves the asterisks on screen. This
   handles the three inline marks that actually show up — bold, italic and
   code — and nothing else: block markdown never appears in these answers, and
   a full parser would be a dependency for two characters. Unmatched marks are
   left as literal text, which is what you want mid-stream while the closing
   `**` hasn't arrived yet.
   ──────────────────────────────────────────────────────────────────────── */

const INLINE_MD = /(\*\*[^*\n]+\*\*|(?<![*\w])\*[^*\n]+\*(?!\w)|`[^`\n]+`)/g;

function renderInline(text: string, key: string) {
  return text.split(INLINE_MD).map((part, i) => {
    const id = `${key}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={id} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={id}
          className="rounded bg-foreground/[0.08] px-1 py-px font-mono text-[12px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={id}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function relativeTime(t: number): string {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86_400)}d`;
}

function groupByDay(sessions: Session[]) {
  const startOfDay = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const today = startOfDay(Date.now());
  const DAY = 86_400_000;
  const groups: Record<string, Session[]> = {};
  for (const s of [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const diff = Math.round((today - startOfDay(s.updatedAt)) / DAY);
    const label =
      diff <= 0
        ? "Today"
        : diff === 1
          ? "Yesterday"
          : new Date(s.updatedAt).toLocaleDateString();
    (groups[label] ??= []).push(s);
  }
  return groups;
}

/* ──────────────────────────────────────────────────────────────────────── */

export function AiChat() {
  const [mounted, setMounted] = useState(false);
  const { open, setOpen } = useChat();
  const [view, setView] = useState<"chat" | "history">("chat");
  const [{ sessions, currentId }, setStore] = useState(() => {
    const now = Date.now();
    const current: Session = {
      id: uid(),
      title: "New chat",
      createdAt: now,
      updatedAt: now,
      activities: [],
    };
    return { sessions: [current], currentId: current.id };
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // Contextual follow-up suggestions, tied to the session they belong to.
  const [suggest, setSuggest] = useState<{ sessionId: string; items: string[] }>({
    sessionId: "",
    items: [],
  });

  const abortRef = useRef<AbortController | null>(null);
  const turnSeq = useRef(0); // bumped each send/newChat; guards stale suggestions
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  // Points at the latest askExternally so the window listener (attached once)
  // always fires against current state without re-subscribing every render.
  const askRef = useRef<(prompt: string) => void>(() => {});

  const current = sessions.find((s) => s.id === currentId) ?? sessions[0];
  // Only finished conversations belong in history — skip blank "New chat" sessions.
  const grouped = useMemo(
    () => groupByDay(sessions.filter((s) => s.activities.length > 0)),
    [sessions],
  );
  const lastType = current.activities[current.activities.length - 1]?.content.type;
  const thinking = busy && lastType === "prompt"; // between the prompt and the first token

  function patch(id: string, fn: (s: Session) => Session) {
    setStore((st) => ({
      ...st,
      sessions: st.sessions.map((s) => (s.id === id ? fn(s) : s)),
    }));
  }

  // Client-only widget: avoids any SSR/hydration mismatch and lets the FAB
  // play its entrance animation on mount. The one-shot mount flag is a
  // deliberate hydration guard, so the set-state-in-effect rule doesn't apply.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Grow the composer to fit, up to a cap.
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px";
  }, [input]);

  // Pin to the bottom as the conversation grows.
  useEffect(() => {
    if (view !== "chat") return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [current.activities, busy, view, open, suggest.items]);

  // No dep array: runs after every commit so the ref tracks the latest closure.
  useEffect(() => {
    askRef.current = askExternally;
  });

  // A CTA anywhere on the site (e.g. a case-study "Ask me about this project"
  // button) fires `pedro:ask`; spring open and answer it in a fresh thread.
  useEffect(() => {
    const onAsk = (e: Event) => {
      const { prompt } = (e as CustomEvent<AskDetail>).detail ?? {};
      if (prompt) askRef.current(prompt);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, []);

  // Best-effort contextual follow-ups, fetched after an answer completes.
  // Guarded by turnSeq so a newer prompt's suggestions can't be clobbered by a
  // slower in-flight request from an older turn.
  async function fetchSuggestions(
    sessionId: string,
    msgs: ChatMessage[],
    myTurn: number,
  ) {
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, sessionId }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { suggestions?: unknown };
      const items = Array.isArray(data.suggestions)
        ? data.suggestions.filter((x): x is string => typeof x === "string").slice(0, 3)
        : [];
      if (turnSeq.current === myTurn && items.length) {
        setSuggest({ sessionId, items });
      }
    } catch {
      /* no follow-ups is fine */
    }
  }

  async function streamReply(id: string, history: ChatMessage[]) {
    const ac = new AbortController();
    abortRef.current = ac;
    const myTurn = turnSeq.current;
    let acc = "";
    let respId: string | null = null;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, sessionId: id }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        patch(id, (s) => ({
          ...s,
          updatedAt: Date.now(),
          activities: [
            ...s.activities,
            act({
              type: "error",
              body: "Something went wrong reaching me. Try again in a moment.",
            }),
          ],
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        if (!respId) {
          const id2 = uid();
          respId = id2;
          patch(id, (s) => ({
            ...s,
            updatedAt: Date.now(),
            activities: [
              ...s.activities,
              {
                id: id2,
                createdAt: Date.now(),
                content: { type: "response", text: acc, streaming: true },
              },
            ],
          }));
        } else {
          const id2 = respId;
          patch(id, (s) => ({
            ...s,
            updatedAt: Date.now(),
            activities: s.activities.map((a) =>
              a.id === id2
                ? { ...a, content: { type: "response", text: acc, streaming: true } }
                : a,
            ),
          }));
        }
      }

      if (respId) {
        const id2 = respId;
        patch(id, (s) => ({
          ...s,
          activities: s.activities.map((a) =>
            a.id === id2
              ? { ...a, content: { type: "response", text: acc, streaming: false } }
              : a,
          ),
        }));
        // Answer landed — ask for follow-ups based on the full exchange.
        void fetchSuggestions(id, [...history, { role: "assistant", content: acc }], myTurn);
      } else {
        // Stream produced nothing (e.g. a refusal) — offer a graceful fallback.
        patch(id, (s) => ({
          ...s,
          updatedAt: Date.now(),
          activities: [
            ...s.activities,
            act({
              type: "response",
              text: `I'd rather not get into that one. Ask me about my work or design approach — or reach me at ${site.email}.`,
            }),
          ],
        }));
      }
    } catch (err) {
      if (ac.signal.aborted || (err as Error)?.name === "AbortError") return;
      patch(id, (s) => ({
        ...s,
        updatedAt: Date.now(),
        activities: [
          ...s.activities,
          act({ type: "error", body: "Connection lost mid-answer. Try again." }),
        ],
      }));
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  function send(raw = input) {
    const body = raw.trim();
    if (!body || busy) return;
    setInput("");
    setView("chat");
    turnSeq.current += 1;
    setSuggest({ sessionId: "", items: [] });
    const id = currentId;

    const sessionNow = sessions.find((s) => s.id === id) ?? current;
    const history: ChatMessage[] = sessionNow.activities.flatMap(
      (a): ChatMessage[] =>
        a.content.type === "prompt"
          ? [{ role: "user", content: a.content.body }]
          : a.content.type === "response"
            ? [{ role: "assistant", content: a.content.text }]
            : [],
    );
    history.push({ role: "user", content: body });

    patch(id, (s) => ({
      ...s,
      title: s.activities.length === 0 ? truncate(body) : s.title,
      updatedAt: Date.now(),
      activities: [...s.activities, act({ type: "prompt", body })],
    }));
    setBusy(true);
    void streamReply(id, history);
  }

  function newChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    turnSeq.current += 1;
    setSuggest({ sessionId: "", items: [] });
    const now = Date.now();
    const s: Session = {
      id: uid(),
      title: "New chat",
      createdAt: now,
      updatedAt: now,
      activities: [],
    };
    setStore((st) => ({ sessions: [s, ...st.sessions], currentId: s.id }));
    setView("chat");
    setTimeout(() => taRef.current?.focus(), 0);
  }

  // Driven by the `pedro:ask` event, not the composer. Springs the panel open
  // and answers in a clean, single-topic thread: it reuses the current session
  // only when it's still empty, otherwise it starts a fresh one so an external
  // ask never lands inside an unrelated conversation. Takes over any in-flight
  // answer, so it doesn't wait behind the `busy` guard the way send() does.
  function askExternally(rawPrompt: string) {
    const body = rawPrompt.trim();
    if (!body) return;

    abortRef.current?.abort();
    abortRef.current = null;

    setOpen(true);
    setView("chat");
    turnSeq.current += 1;
    setSuggest({ sessionId: "", items: [] });

    const now = Date.now();
    const promptActivity = act({ type: "prompt", body });

    let targetId: string;
    if (current.activities.length === 0) {
      targetId = current.id;
      patch(current.id, (s) => ({
        ...s,
        title: truncate(body),
        updatedAt: now,
        activities: [promptActivity],
      }));
    } else {
      const s: Session = {
        id: uid(),
        title: truncate(body),
        createdAt: now,
        updatedAt: now,
        activities: [promptActivity],
      };
      targetId = s.id;
      setStore((st) => ({ sessions: [s, ...st.sessions], currentId: s.id }));
    }

    setBusy(true);
    void streamReply(targetId, [{ role: "user", content: body }]);
  }

  if (!mounted) return null;

  return (
    <MotionConfig reducedMotion="user">
      {/* Docked (lg+), this is a layer *underneath* the page: a full-height rail
          pinned to the right that the shell slides off to reveal, so it needs no
          entrance of its own and stays mounted at z-0. Undocked, there's no room
          beside the content, so the same element becomes an inset sheet on top
          and fades in. */}
      <aside
        role="dialog"
        aria-label="Ask Pedro"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-1.5 z-50 ml-auto flex max-w-[26rem] flex-col overflow-hidden rounded-2xl bg-layer font-sans shadow-[0_1px_2px_rgba(17,17,24,0.04),0_8px_24px_rgba(17,17,24,0.1),0_18px_44px_rgba(17,17,24,0.1)] ring-1 ring-border transition-[opacity,transform] duration-500 ease-drawer lg:visible lg:inset-y-0 lg:left-auto lg:right-0 lg:z-0 lg:w-96 lg:max-w-none lg:translate-y-0 lg:rounded-none lg:opacity-100 lg:shadow-none lg:ring-0 dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_12px_32px_rgba(0,0,0,0.55)] ${
          open
            ? "lg:translate-x-0"
            : // Undocked it fades out of the way; docked it stays put but rests
              // a nudge to the right, so opening reads as the shell peeling off
              // a layer that settles into place, not a panel arriving.
              "invisible translate-y-2 opacity-0 lg:translate-x-2"
        }`}
      >
        {/* header */}
        <header className="flex h-12 shrink-0 items-center gap-1 border-b border-foreground/10 pl-4 pr-2.5">
          <span className="flex-1 truncate text-[13px] font-medium text-foreground">
            {view === "history" ? "History" : current.title}
          </span>
          <IconButton
            label="History"
            active={view === "history"}
            onClick={() => setView((v) => (v === "history" ? "chat" : "history"))}
          >
            <Clock />
          </IconButton>
          <IconButton label="New chat" onClick={newChat}>
            <Plus />
          </IconButton>
          <IconButton label="Close" onClick={() => setOpen(false)}>
            <Close />
          </IconButton>
        </header>

        {/* body */}
        {view === "history" ? (
          <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3">
            {Object.keys(grouped).length === 0 ? (
              <p className="px-2.5 py-6 text-center text-[13px] text-muted">
                No conversations yet.
              </p>
            ) : (
              Object.entries(grouped).map(([label, items]) => (
                <div key={label} className="mb-1.5">
                  <h4 className="px-2.5 py-1 text-[11px] font-semibold text-muted">
                    {label}
                  </h4>
                  {items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setStore((st) => ({ ...st, currentId: s.id }));
                        setSuggest({ sessionId: "", items: [] });
                        setView("chat");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-foreground/[0.06]"
                    >
                      <span className="flex-1 truncate text-[13px] text-foreground">
                        {s.title}
                      </span>
                      <span className="shrink-0 text-[12px] tabular-nums text-muted">
                        {relativeTime(s.updatedAt)}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5"
          >
            {current.activities.length === 0 && !busy ? (
              <EmptyState onPick={(q) => send(q)} />
            ) : (
              <>
                {current.activities.map((a) => (
                  <ActivityRow key={a.id} content={a.content} />
                ))}
                {thinking && <ThinkingRow />}
                {!busy &&
                  lastType === "response" &&
                  suggest.sessionId === current.id &&
                  suggest.items.length > 0 && (
                    <FollowUps items={suggest.items} onPick={(q) => send(q)} />
                  )}
              </>
            )}
          </div>
        )}

        {/* composer */}
        {view === "chat" && (
          <div className="shrink-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-4">
            <div className="rounded-[12px] border border-foreground/[0.12] bg-field px-3.5 py-3 transition-colors focus-within:border-foreground/25">
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                placeholder="Ask me anything…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="max-h-24 w-full resize-none bg-transparent text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted"
              />
              <div className="mt-1.5 flex items-center">
                <div className="flex-1" />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || busy}
                  aria-label="Send"
                  className={`grid h-7 w-7 place-items-center rounded-full transition-[background-color,color,scale] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 ${
                    input.trim() && !busy
                      ? "bg-accent text-background hover:opacity-90"
                      : "bg-foreground/[0.08] text-muted"
                  }`}
                >
                  <ArrowUp />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </MotionConfig>
  );
}

/* ── activity rows ──────────────────────────────────────────────────────── */

function ActivityRow({ content }: { content: Content }) {
  if (content.type === "prompt") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-[14px] bg-foreground/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground">
          {content.body}
        </div>
      </motion.div>
    );
  }

  if (content.type === "error") {
    return (
      <div className="text-[13px] leading-relaxed text-red-500">{content.body}</div>
    );
  }

  // response — no `layout` here: it would spring the box height on every
  // streamed token and make the text visibly bounce as it grows.
  const segments = parseSegments(content.text, !!content.streaming);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="group/resp text-[13px] leading-relaxed text-foreground/90"
    >
      <div>
        {segments.map((seg, i) =>
          seg.kind === "text" ? (
            <span key={i} className="whitespace-pre-wrap">
              {renderInline(seg.text, String(i))}
            </span>
          ) : (
            <CaseCard key={i} slug={seg.slug} />
          ),
        )}
        {content.streaming && (
          <motion.span
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] rounded-full bg-foreground align-middle"
          />
        )}
      </div>

      {!content.streaming && content.text.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover/resp:opacity-100">
          <CopyButton text={stripTokens(content.text)} />
        </div>
      )}
    </motion.div>
  );
}

/* A case study recommended mid-answer, rendered as a clickable card. Links to
   the on-site case page; the chat widget lives in the root layout, so this
   soft-navigates and the conversation stays open behind the page. */
function CaseCard({ slug }: { slug: string }) {
  const project = PROJECTS_BY_SLUG.get(slug);
  if (!project) return null; // unknown slug → skip rather than render a dead link
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 460, damping: 30 }}
      className="my-3"
    >
      <Link
        href={`/${project.slug}`}
        className="group/card flex items-center gap-3 rounded-[12px] border border-foreground/[0.12] px-3.5 py-3 transition-colors hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-muted">
            Case study
          </span>
          <span className="mt-0.5 line-clamp-2 text-[12.5px] font-medium leading-snug text-foreground">
            {project.title}
          </span>
          <span className="mt-1 block text-[11.5px] text-muted">
            {project.company} · {project.year}
          </span>
        </span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-foreground/[0.2] text-muted transition-colors group-hover/card:border-foreground/30 group-hover/card:text-foreground">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </motion.div>
  );
}

function ThinkingRow() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="flex items-center gap-1.5"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col items-center justify-center gap-5 text-center"
    >
      <Logo className="h-10 w-10 rounded-[10px] shadow-sm" />
      <p className="max-w-[15rem] text-pretty text-[13px] leading-relaxed text-muted">
        Ask me about my work, design approach, and experience — it&apos;s me, Pedro.
      </p>
      <div className="flex flex-col items-center gap-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-full border border-foreground/[0.12] px-3 py-1.5 text-[12px] leading-[18px] text-foreground/80 transition-colors hover:bg-foreground/[0.06] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          >
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function FollowUps({ items, onPick }: { items: string[]; onPick: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mt-1 flex flex-col gap-0.5 border-t border-foreground/10 pt-4"
    >
      <span className="mb-1.5 px-2 text-[11px] font-medium text-muted">Keep exploring</span>
      {items.map((q, i) => (
        <motion.button
          key={q}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 460, damping: 34 }}
          onClick={() => onPick(q)}
          className="group/fu flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-foreground/90 transition-colors hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
        >
          <span className="flex-1">{q}</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted transition-colors group-hover/fu:text-foreground" />
        </motion.button>
      ))}
    </motion.div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* clipboard can be blocked — fail quietly */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="ok"
            initial={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.25, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="grid place-items-center"
          >
            <Check className="h-3 w-3" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.25, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="grid place-items-center"
          >
            <Copy className="h-3 w-3" />
          </motion.span>
        )}
      </AnimatePresence>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function IconButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 ${
        active
          ? "bg-foreground/[0.08] text-foreground"
          : "text-muted hover:bg-foreground/[0.06] hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ── icons (inline, no deps) ────────────────────────────────────────────── */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Logo({ className }: { className?: string }) {
  // Pedro's logo (also the site favicon, served from /logo.svg). Plain <img>:
  // it's a static SVG, so next/image would need dangerouslyAllowSVG.
  // The logo is drawn for dark backgrounds (light orb on a near-black square),
  // so it sits native in dark mode. In light mode it would be a heavy black
  // block, so invert the grayscale art there (and cancel the invert in dark).
  // shrink-0 keeps the flex FAB from squishing it.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt=""
      aria-hidden
      draggable={false}
      className={`shrink-0 select-none invert dark:invert-0 ${className ?? ""}`}
    />
  );
}
function Clock() {
  return (
    <svg viewBox="0 0 16 16" {...stroke} className="h-4 w-4">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.4 1.4" />
    </svg>
  );
}
function Plus() {
  return (
    <svg viewBox="0 0 16 16" {...stroke} strokeWidth={1.6} className="h-4 w-4">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}
function Close() {
  return (
    <svg viewBox="0 0 16 16" {...stroke} strokeWidth={1.6} className="h-4 w-4">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
function ArrowUp() {
  return (
    <svg viewBox="0 0 16 16" {...stroke} strokeWidth={1.7} className="h-4 w-4">
      <path d="M8 13V3M4 6.5 8 3l4 3.5" />
    </svg>
  );
}
function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" {...stroke} strokeWidth={1.6} className={className}>
      <path d="M5 11l6-6M6 5h5v5" />
    </svg>
  );
}
function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" {...stroke} strokeWidth={2} className={className}>
      <path d="M3.5 8.5 6.5 11.5 12.5 5" />
    </svg>
  );
}
function Copy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" {...stroke} className={className}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
    </svg>
  );
}
