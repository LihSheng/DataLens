/**
 * Phoenix API service — proxies through backend at /api/phoenix/*
 * Never calls Phoenix UI or Phoenix API directly.
 */

import { httpClient } from "./httpClient";

export const phoenixService = {
  listTraces: (limit = 50, offset = 0) =>
    httpClient.get("/api/phoenix/traces", { params: { limit, offset } }),

  getTrace: (traceId: string) =>
    httpClient.get(`/api/phoenix/traces/${traceId}`),

  getSpans: (traceId: string) =>
    httpClient.get("/api/phoenix/spans", { params: { trace_id: traceId } }),

  getEvaluations: (traceId: string) =>
    httpClient.get("/api/phoenix/evaluations", {
      params: { trace_id: traceId },
    }),

  getSummary: () => httpClient.get("/api/phoenix/summary"),
};
