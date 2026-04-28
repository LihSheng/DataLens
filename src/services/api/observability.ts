/**
 * Observability API service — all observability endpoints via httpClient.
 * Raw responses are returned; mapping to FE types happens in the hooks.
 */

import { httpClient } from "../httpClient";
import type {
  EvaluationRun,
  FeedbackStats,
  CostSummary,
  AuditFilters,
} from "../../types/observability";

// Raw BE response type for audit log (BE uses items/limit/offset, not events/page)
interface AuditLogResponse {
  items?: Record<string, unknown>[];
  total?: number;
  limit?: number;
  offset?: number;
}

export const observabilityApi = {
  getEvaluations: async (): Promise<{ runs: EvaluationRun[] }> => {
    const res = await httpClient.get<{ runs: EvaluationRun[] }>(
      "/api/evaluations",
    );
    return res.data;
  },

  runEvaluation: async (): Promise<{
    message: string;
    traceId: string;
    status: string;
  }> => {
    const res = await httpClient.post<{
      message: string;
      traceId: string;
      status: string;
    }>("/api/evaluations/run");
    return res.data;
  },

  getFeedbackStats: async (): Promise<FeedbackStats> => {
    const res = await httpClient.get<FeedbackStats>("/api/feedback/stats");
    return res.data;
  },

  getCostSummary: async (): Promise<CostSummary> => {
    const res = await httpClient.get<CostSummary>("/api/costs/summary");
    return res.data;
  },

  getAuditLog: async (
    filters: AuditFilters = {},
  ): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();
    if (filters.userId) params.set("user_id", filters.userId);
    if (filters.eventType) params.set("action", filters.eventType);
    if (filters.dateFrom) params.set("date_from", filters.dateFrom);
    if (filters.dateTo) params.set("date_to", filters.dateTo);
    if (filters.page)
      params.set(
        "offset",
        String((filters.page - 1) * (filters.pageSize ?? 50)),
      );
    if (filters.pageSize) params.set("limit", String(filters.pageSize));

    const res = await httpClient.post<AuditLogResponse>(
      `/api/admin/audit?${params.toString()}`,
    );
    return res.data;
  },

  exportAuditCsv: async (): Promise<string> => {
    const res = await httpClient.get<string>("/api/admin/audit/export", {
      responseType: "text",
    });
    return res.data;
  },
};
