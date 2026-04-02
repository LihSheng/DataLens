/**
 * Phoenix API response normalizers.
 *
 * Arize Phoenix v4 returns spans with field names and units that differ from
 * the frontend types. This module provides a stable transformation layer so
 * the UI is never coupled to Phoenix's internal schema.
 *
 * Known Phoenix → Frontend mismatches:
 *   span_id         → spanId
 *   parent_id       → parentSpanId
 *   display_name    → name
 *   start_time      → startTime
 *   end_time        → endTime
 *   duration        → nanoseconds → milliseconds (divide by 1_000_000)
 *   status_code     → numeric → string "ok" | "error"
 *   attributes      → passthrough (keys may be snake_case)
 */

import type { Span, Trace, TraceSummary } from "../types/observability";

// Phoenix v4 raw response shapes
interface PhoenixSpanRaw {
  span_id?: string;
  parent_id?: string;
  display_name?: string;
  name?: string;
  start_time?: string;
  end_time?: string;
  duration?: number; // nanoseconds
  attributes?: Record<string, unknown>;
  status_code?: number;
  status_message?: string;
}

interface PhoenixTraceRaw {
  trace_id?: string;
  trace_uuid?: string;
  start_time?: string;
  end_time?: string;
  latency_ms?: number;
  num_spans?: number;
}

interface PhoenixEvaluationRaw {
  name?: string;
  label?: number | string;
  score?: number;
  metric_name?: string;
  result?: number | string;
}

// ─── Span normaliser ─────────────────────────────────────────────────────────

/** Phoenix span → frontend Span (stable contract) */
export function normaliseSpan(raw: PhoenixSpanRaw): Span {
  return {
    spanId: raw.span_id ?? "",
    parentSpanId: raw.parent_id,
    name: raw.display_name ?? raw.name ?? "",
    startTime: raw.start_time ?? "",
    endTime: raw.end_time,
    duration:
      raw.duration != null ? Math.round(raw.duration / 1_000_000) : undefined, // ns → ms
    attributes: normaliseAttributes(raw.attributes),
    status: normaliseStatusCode(raw.status_code, raw.status_message),
  };
}

/** Normalise an array of Phoenix spans */
export function normaliseSpans(spans: PhoenixSpanRaw[]): Span[] {
  return spans.map(normaliseSpan);
}

// ─── Trace normalisers ──────────────────────────────────────────────────────

/** Phoenix trace summary row → frontend TraceSummary */
export function normaliseTraceSummary(raw: PhoenixTraceRaw): TraceSummary {
  return {
    traceId: raw.trace_id ?? raw.trace_uuid ?? "",
    startTime: raw.start_time ?? "",
    endTime: raw.end_time,
    latencyMs: raw.latency_ms,
    numSpans: raw.num_spans ?? 0,
  };
}

/** Phoenix single trace → frontend Trace */
export function normaliseTrace(raw: PhoenixTraceRaw): Trace {
  return {
    traceId: raw.trace_id ?? raw.trace_uuid ?? "",
    startTime: raw.start_time ?? "",
    endTime: raw.end_time,
    latencyMs: raw.latency_ms,
    attributes: normaliseAttributes(
      raw.attributes as Record<string, unknown> | undefined,
    ),
  };
}

/** Normalise trace list response (handles {data: [...]} vs [...] wrapper) */
export function normaliseTraceList(
  raw: PhoenixTraceRaw[] | { data: PhoenixTraceRaw[] },
): TraceSummary[] {
  const traces: PhoenixTraceRaw[] = Array.isArray(raw)
    ? raw
    : (raw?.data ?? []);
  return traces.map(normaliseTraceSummary);
}

// ─── Evaluation normaliser ──────────────────────────────────────────────────

/** Phoenix evaluation annotation → frontend EvalScore */
export function normaliseEvalScore(raw: PhoenixEvaluationRaw): EvalScore {
  return {
    name: raw.name ?? raw.metric_name ?? "",
    label: raw.label ?? raw.result ?? "",
    score: raw.score,
  };
}

/** Normalise evaluation list */
export function normaliseEvalScores(
  raw: PhoenixEvaluationRaw[] | { data: PhoenixEvaluationRaw[] },
): EvalScore[] {
  const evals: PhoenixEvaluationRaw[] = Array.isArray(raw)
    ? raw
    : (raw?.data ?? []);
  return evals.map(normaliseEvalScore);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Phoenix uses numeric status codes: 0 = ok, 2 = error */
function normaliseStatusCode(code?: number, message?: string): Span["status"] {
  if (message) return message;
  if (code === 0) return "ok";
  if (code === 2) return "error";
  return undefined;
}

/**
 * Flatten Phoenix nested attributes into top-level fields where safe.
 * Phoenix commonly nests retrieval data under "attributes.retrieved_chunk".
 * We promote useful top-level keys so components don't need deep access.
 */
function normaliseAttributes(
  attrs?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!attrs) return undefined;
  // passthrough — components access via getAttribute() or dot-notation
  return attrs;
}
