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
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

  return useQuery<PaginatedAuditEvents>({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit log");
      return res.json();
    },
  });
}

// ─── useExportAudit ───────────────────────────────────────────────────────

export function useExportAudit() {
  return useQuery<string>({
    queryKey: ["audit", "export"],
    queryFn: async () => {
      const res = await fetch("/api/audit/export?format=csv");
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
    queryFn: async () => {
      const res = await phoenixService.listTraces(limit);
      return res.data;
    },
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
      return { trace: trace.data, spans: spans.data, evals: evals.data };
    },
    enabled: !!traceId,
  });
}
