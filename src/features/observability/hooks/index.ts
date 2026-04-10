import { useQuery } from "@tanstack/react-query";
import type {
  EvaluationRun,
  FeedbackStats,
  CostSummary,
  AuditFilters,
  PaginatedAuditEvents,
} from "../../../types/observability";

// ─── useEvaluationRuns ───────────────────────────────────────────────────

export function useEvaluationRuns() {
  return useQuery<EvaluationRun[]>({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const res = await fetch("/api/evaluations");
      if (!res.ok) throw new Error("Failed to fetch evaluations");
      const data = await res.json();
      return data.runs;
    },
  });
}

// ─── useRunEvaluation ─────────────────────────────────────────────────────

export function useRunEvaluation() {
  return useQuery<{ message: string; traceId: string; status: string }>({
    queryKey: ["evaluations", "run"],
    queryFn: async () => {
      const res = await fetch("/api/evaluations/run", { method: "POST" });
      if (!res.ok) throw new Error("Failed to run evaluation");
      return res.json();
    },
    enabled: false,
  });
}

// ─── useFeedbackStats ────────────────────────────────────────────────────

export function useFeedbackStats() {
  return useQuery<FeedbackStats>({
    queryKey: ["feedback", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/feedback/stats");
      if (!res.ok) throw new Error("Failed to fetch feedback stats");
      return res.json();
    },
  });
}

// ─── useCostSummary ──────────────────────────────────────────────────────

export function useCostSummary() {
  return useQuery<CostSummary>({
    queryKey: ["costs", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/costs/summary");
      if (!res.ok) throw new Error("Failed to fetch cost summary");
      return res.json();
    },
  });
}

// ─── useAuditLog ─────────────────────────────────────────────────────────

export function useAuditLog(filters: AuditFilters = {}) {
  const params = new URLSearchParams();
  if (filters.userId) params.set("user_id", filters.userId);
  if (filters.eventType) params.set("action", filters.eventType);
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.page)
    params.set("offset", String((filters.page - 1) * (filters.pageSize ?? 50)));
  if (filters.pageSize) params.set("limit", String(filters.pageSize));

  return useQuery<PaginatedAuditEvents>({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit?${params.toString()}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to fetch audit log");
      const data = await res.json();
      // Map BE response (items/limit/offset) → FE type (events/page/totalPages)
      const limit = data.limit ?? 50;
      const offset = data.offset ?? 0;
      const totalPages = Math.ceil((data.total ?? 0) / limit);
      return {
        events: (data.items ?? []).map((item: Record<string, unknown>) => ({
          id: String(item.id ?? ""),
          userId: String(item.user_id ?? ""),
          userName: String(item.user_id ?? ""), // BE doesn't provide userName
          eventType: String(item.action ?? ""),
          description: item.details
            ? JSON.stringify(item.details)
            : String(item.resource ?? ""),
          metadata: item.details as Record<string, unknown> | undefined,
          ipAddress: String(item.ip_address ?? ""),
          timestamp: String(item.created_at ?? ""),
        })),
        total: data.total ?? 0,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages,
      };
    },
  });
}

// ─── useExportAudit ───────────────────────────────────────────────────────

export function useExportAudit() {
  return useQuery<string>({
    queryKey: ["audit", "export"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit/export");
      if (!res.ok) throw new Error("Failed to export audit log");
      return res.text();
    },
    enabled: false,
  });
}

// ─── Phoenix / Traces ──────────────────────────────────────────────────────────

import { phoenixService } from "../../../services/phoenixService";
import type { TraceSummary } from "../../../types/observability";

export function useTraces(limit = 50) {
  return useQuery<TraceSummary[]>({
    queryKey: ["phoenix", "traces"],
    queryFn: () => phoenixService.listTraces(limit),
    refetchInterval: 30_000,
  });
}

export function useTraceDetail(traceId: string | null) {
  return useQuery({
    queryKey: ["phoenix", "trace", traceId],
    queryFn: async () => {
      const [trace, spans, evals] = await Promise.all([
        phoenixService.getTrace(traceId!),
        phoenixService.getSpans(traceId!),
        phoenixService.getEvaluations(traceId!),
      ]);
      return { trace, spans, evals };
    },
    enabled: !!traceId,
  });
}
