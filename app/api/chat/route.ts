import { streamText } from "ai";
import { propagateAttributes } from "@langfuse/tracing";
import { buildSystemPrompt } from "@/lib/persona";
import { site } from "@/lib/site";
import {
  flushTelemetry,
  getOpenRouter,
  isAllowedOrigin,
  models,
  sanitize,
  sessionIdOf,
  telemetryEnabled,
} from "@/lib/chat-util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TOKENS = 1024;
const TEMPERATURE = 0.6;

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const status =
    (err as { statusCode?: number; status?: number })?.statusCode ??
    (err as { statusCode?: number; status?: number })?.status;

  if (status === 429 || /rate.?limit/i.test(msg)) {
    return "\n\n[I'm getting a lot of questions right now — give it a moment and try again.]";
  }
  if (status === 402 || /credit|quota|insufficient|payment/i.test(msg)) {
    return `\n\n[My chat is out of credit at the moment — reach me directly at ${site.email}.]`;
  }
  if (status === 404 || /not found|no endpoints|no allowed/i.test(msg)) {
    return "\n\n[That model isn't available right now. Try again shortly.]";
  }
  return "\n\n[Sorry — I hit a snag answering that. Try again in a moment.]";
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: { messages?: unknown; sessionId?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = sanitize(body.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response("Last message must be from the user", { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response("OPENROUTER_API_KEY is not set", { status: 500 });
  }

  const system = await buildSystemPrompt();
  const openrouter = getOpenRouter();
  const encoder = new TextEncoder();

  // Group this conversation's turns under one Langfuse session. No-op when
  // telemetry is off; flush runs after the streamed response finishes.
  const sessionId = sessionIdOf(body.sessionId);
  flushTelemetry();

  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      const run = async () => {
        let produced = false;
        let lastErr: unknown = null;

        // Probe + failover: the first model to emit any text wins; if a model
        // errors before producing output, fall through to the next one.
        for (const model of models()) {
          try {
            const result = streamText({
              model: openrouter(model),
              system,
              messages,
              temperature: TEMPERATURE,
              maxOutputTokens: MAX_TOKENS,
              abortSignal: req.signal,
              experimental_telemetry: telemetryEnabled
                ? {
                    isEnabled: true,
                    functionId: "portfolio-chat",
                    // Records which model actually answered — failovers show
                    // up as their own (errored) generations in the trace.
                    metadata: { model },
                  }
                : undefined,
            });

            for await (const delta of result.textStream) {
              produced = true;
              controller.enqueue(encoder.encode(delta));
            }

            if (produced) {
              controller.close();
              return;
            }
            // produced nothing — try the next model
          } catch (err) {
            lastErr = err;
            if (req.signal.aborted) {
              controller.close();
              return;
            }
            if (produced) {
              // Partial answer already sent — can't switch models cleanly, so
              // surface a readable note inline and stop.
              controller.enqueue(encoder.encode(friendlyError(err)));
              controller.close();
              return;
            }
            // no output yet — fall through to the next model
          }
        }

        controller.enqueue(encoder.encode(friendlyError(lastErr)));
        controller.close();
      };

      // propagateAttributes tags every AI SDK span created inside `run` with
      // the session/name, so a conversation's turns group in Langfuse.
      return telemetryEnabled
        ? propagateAttributes(
            { sessionId, traceName: "portfolio-chat", tags: ["portfolio-chat"] },
            run,
          )
        : run();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
    },
  });
}
