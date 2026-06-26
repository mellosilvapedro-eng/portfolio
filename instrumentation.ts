import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

/**
 * OpenTelemetry → Langfuse wiring for the portfolio AI agent.
 *
 * The Vercel AI SDK emits OTel spans for every `streamText`/`generateText`
 * call whose `experimental_telemetry.isEnabled` is set (see app/api/chat and
 * app/api/suggest). This file registers a tracer that ships those spans to
 * Langfuse, where each chat turn lands as a trace carrying the full system
 * prompt, the visitor's messages, the model that answered, token counts,
 * latency and cost — the raw material for understanding and evaluating the
 * agent. `sessionId` from the client groups a conversation's turns together.
 *
 * Telemetry is opt-in: with no LANGFUSE_* keys set (local dev, CI, anyone who
 * clones the repo) the processor is never created and the agent runs exactly
 * as before — same lazy pattern as the OpenRouter key in lib/chat-util.ts.
 *
 * `langfuseSpanProcessor` is exported so the route handlers can force-flush
 * spans before the serverless function freezes (see `flushTelemetry` in
 * lib/chat-util.ts). Without that flush, spans emitted while a response is
 * still streaming are routinely dropped on Vercel.
 */
export const langfuseSpanProcessor = process.env.LANGFUSE_PUBLIC_KEY
  ? new LangfuseSpanProcessor({
      // Separate prod / preview / local-dev traffic in the Langfuse dashboards
      // so experiments and dev noise don't pollute production analytics. Vercel
      // sets VERCEL_ENV automatically (production | preview | development);
      // fall back to NODE_ENV when running outside Vercel.
      environment:
        process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    })
  : null;

export function register() {
  // NodeTracerProvider is Node-only. Every route here runs on the Node runtime,
  // but guard anyway so an Edge server instance never tries to register it.
  if (!langfuseSpanProcessor || process.env.NEXT_RUNTIME !== "nodejs") return;

  new NodeTracerProvider({ spanProcessors: [langfuseSpanProcessor] }).register();
}
