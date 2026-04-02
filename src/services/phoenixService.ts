/**
 * Phoenix API service — proxies through backend at /api/phoenix/*
 * Never calls Phoenix UI or Phoenix API directly.
 *
 * All responses pass through normalisation so the UI always sees a stable,
 * consistent contract regardless of Phoenix API version drift.
 */

import { httpClient } from "./httpClient";
import {
  normaliseTraceList,
  normaliseTrace,
  normaliseSpans,
  normaliseEvalScores,
} from "../lib/phoenix";
import type {
  TraceSummary,
  Trace,
  Span,
  EvalScore,
} from "../types/observability";

export const phoenixService = {
  /** List recent traces — returns TraceSummary[] */
  listTraces: async (limit = 50, offset = 0): Promise<TraceSummary[]> => {
    const res = await httpClient.get("/api/phoenix/traces", {
      params: { limit, offset },
    });
    return normaliseTraceList(res.data);
  },

  /** Get a single trace — returns Trace */
  getTrace: async (traceId: string): Promise<Trace> => {
    const res = await httpClient.get(`/api/phoenix/traces/${traceId}`);
    return normaliseTrace(res.data);
  },

  /** Get spans for a trace — returns Span[] */
  getSpans: async (traceId: string): Promise<Span[]> => {
    const res = await httpClient.get("/api/phoenix/spans", {
      params: { trace_id: traceId },
    });
    const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    return normaliseSpans(raw);
  },

  /** Get eval scores for a trace — returns EvalScore[] */
  getEvaluations: async (traceId: string): Promise<EvalScore[]> => {
    const res = await httpClient.get("/api/phoenix/evaluations", {
      params: { trace_id: traceId },
    });
    return normaliseEvalScores(res.data);
  },

  /** Get summary stats — passthrough (Phoenix summary shape varies) */
  getSummary: async () => {
    const res = await httpClient.get("/api/phoenix/summary");
    return res.data;
  },
};
