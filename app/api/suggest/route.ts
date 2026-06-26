import { generateText } from "ai";
import { publishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";
import { getOpenRouter, isAllowedOrigin, models, sanitize } from "@/lib/chat-util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TOPICS = publishedProjects.map((p) => p.title).join("; ");
const EXPERIMENTS = site.experiments.map((e) => e.name).join(", ");

const SUGGEST_SYSTEM = `
You generate follow-up questions for visitors on Pedro Mello's portfolio. Pedro is a
Senior Product Designer (Growth). He can talk about: his roles (Factorial, Jusbrasil,
Carminga, Wine), growth & monetization design, his design philosophy and taste, his
writing on design, growth & business (Substack), his experiments (${EXPERIMENTS}), and
these case studies: ${TOPICS}.

Given the conversation so far, propose 3 short follow-up questions the visitor could ask
Pedro NEXT. Rules:
- Each must be answerable from Pedro's work, experience, or design approach.
- Phrase them as the visitor speaking TO Pedro, first person ("How did you...",
  "What's your...", "Can you..."). English only.
- Keep each under ~8 words. No numbering, no quotes, no trailing punctuation beyond "?".
- Explore NEW angles that follow naturally from the last answer — don't repeat what was
  already asked.
- Output ONLY a JSON array of exactly 3 strings. No prose, no markdown fences.
`.trim();

function parseSuggestions(text: string): string[] {
  let t = text.trim();
  // strip markdown code fences if present
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  try {
    const arr: unknown = JSON.parse(t);
    if (Array.isArray(arr)) {
      return arr
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
    }
  } catch {
    /* fall through */
  }
  return [];
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ suggestions: [] });
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ suggestions: [] });
  }

  const messages = sanitize(body.messages);
  if (messages.length === 0) return Response.json({ suggestions: [] });

  const convo = messages
    .map((m) => `${m.role === "user" ? "Visitor" : "Pedro"}: ${m.content}`)
    .join("\n");
  const prompt = `Conversation so far:\n\n${convo}\n\nNow output a JSON array of exactly 3 short follow-up questions the visitor could ask Pedro next.`;

  const openrouter = getOpenRouter();

  // Reuse the chat model list with failover; first model that returns usable
  // suggestions wins. Any failure degrades to an empty list (chat is unaffected).
  for (const model of models()) {
    try {
      const { text } = await generateText({
        model: openrouter(model),
        system: SUGGEST_SYSTEM,
        prompt,
        temperature: 0.7,
        maxOutputTokens: 200,
        abortSignal: req.signal,
      });
      const suggestions = parseSuggestions(text);
      if (suggestions.length) return Response.json({ suggestions });
    } catch {
      if (req.signal.aborted) break;
      // try the next model
    }
  }

  return Response.json({ suggestions: [] });
}
