import { unstable_cache } from "next/cache";
import { site } from "@/lib/site";

/**
 * Server-only. Fetches Pedro's latest posts from his public Substack RSS feed
 * and formats them for the agent's system prompt, so the digital twin knows
 * what he's been writing about and can point a visitor to a relevant post.
 *
 * Caching is done with `unstable_cache` — NOT the `fetch` Data Cache — on
 * purpose: the chat route is `force-dynamic`, which coerces a bare `fetch` to
 * `{ cache: 'no-store' }`. `unstable_cache` is an independent layer, so the
 * parsed result is shared across requests and refreshed at most once an hour.
 * A failed/slow feed degrades to an empty string; the agent still answers, just
 * without the writing section.
 *
 * NEVER import this module from a client component.
 */

const FEED_URL = `${site.links.substack.replace(/\/+$/, "")}/feed`;
const MAX_POSTS = 6;
const MAX_SUMMARY = 240;
const REVALIDATE_SECONDS = 60 * 60; // refresh at most hourly
const FETCH_TIMEOUT_MS = 8000;

export type SubstackPost = {
  title: string;
  link: string;
  /** ISO yyyy-mm-dd, or "" when the feed date can't be parsed. */
  date: string;
  summary: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&"); // keep last so the above aren't double-decoded
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract the inner text of the first <name>…</name> in `block`, unwrapping CDATA. */
function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return "";
  const cdata = m[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return (cdata ? cdata[1] : m[1]).trim();
}

function toIsoDate(pubDate: string): string {
  const t = Date.parse(pubDate); // RFC-822 e.g. "Fri, 26 Jun 2026 09:42:57 GMT"
  return Number.isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10);
}

async function fetchSubstackPosts(): Promise<SubstackPost[]> {
  const res = await fetch(FEED_URL, {
    headers: {
      "user-agent": `${site.url} portfolio agent`,
      accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.1",
    },
    cache: "no-store", // unstable_cache provides persistence; keep the inner fetch fresh
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Substack feed responded ${res.status}`);

  const xml = await res.text();
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  return items
    .slice(0, MAX_POSTS)
    .map((block) => {
      const title = decodeEntities(tag(block, "title"));
      const link = decodeEntities(tag(block, "link"));
      const date = toIsoDate(tag(block, "pubDate"));
      let summary = stripTags(decodeEntities(tag(block, "description")));
      if (summary.length > MAX_SUMMARY) {
        summary = `${summary.slice(0, MAX_SUMMARY).trimEnd()}…`;
      }
      return { title, link, date, summary };
    })
    .filter((p) => p.title && p.link);
}

const getCachedPosts = unstable_cache(fetchSubstackPosts, ["substack-feed"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["substack"],
});

/** Latest posts, or [] if the feed is unreachable. Cached ~1h across requests. */
export async function getSubstackPosts(): Promise<SubstackPost[]> {
  try {
    return await getCachedPosts();
  } catch {
    return [];
  }
}

/**
 * The writing section for the system prompt, or "" when no posts are available
 * (so `buildSystemPrompt` can filter it out cleanly).
 */
export async function getSubstackSection(): Promise<string> {
  const posts = await getSubstackPosts();
  if (posts.length === 0) return "";

  const lines = posts.map((p) => {
    const when = p.date ? ` (${p.date})` : "";
    const gist = p.summary ? ` — ${p.summary}` : "";
    return `- "${p.title}"${when}: ${p.link}${gist}`;
  });

  return [
    "# My writing (latest posts from my Substack)",
    "These are my most recent posts. When a visitor asks what I write or think about, " +
      "or their question maps onto one of these, mention the post by name and offer the " +
      "link. These are the only posts you know about — don't invent titles or topics " +
      "beyond this list.",
    ...lines,
  ].join("\n");
}
