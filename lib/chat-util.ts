import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { site } from "@/lib/site";

/** Shared helpers for the chat + suggest route handlers. Server-only. */

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const MAX_HISTORY = 20; // keep the last N turns
export const MAX_CHARS = 4000; // clamp any single message

// Model-agnostic preference list (same pattern as SpecNote). First model to
// produce output wins; on error we fall to the next. Override with OPENROUTER_MODEL.
const DEFAULT_MODELS = "anthropic/claude-sonnet-4.6,google/gemini-2.0-flash-001";

// Lazily instantiated so importing this module during `next build` doesn't throw
// when the key is absent.
let _openrouter: ReturnType<typeof createOpenRouter> | null = null;
export function getOpenRouter() {
  if (!_openrouter) {
    _openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
  }
  return _openrouter;
}

export function models(): string[] {
  const list = (process.env.OPENROUTER_MODEL ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  // Empty/blank env → fall back to the default list (?? only covers undefined).
  return list.length ? list : DEFAULT_MODELS.split(",").map((m) => m.trim());
}

/**
 * Light abuse protection: only serve same-origin browser requests. The Origin
 * header is sent by browsers on cross-origin and POST fetches; we accept it when
 * its host matches the request host (covers prod + Vercel previews) or localhost.
 */
export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  if (originHost.startsWith("localhost:") || originHost.startsWith("127.0.0.1:")) {
    return true;
  }

  const allow = new Set<string>();
  const host = req.headers.get("host");
  if (host) allow.add(host);
  try {
    allow.add(new URL(site.url).host);
  } catch {
    /* ignore */
  }

  return allow.has(originHost);
}

export function sanitize(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_HISTORY);
}
