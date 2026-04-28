import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  EvaluationRun,
  FeedbackStats,
  CostSummary,
  AuditFilters,
  PaginatedAuditEvents,
} from "../../../types/observability";
import { observabilityApi } from "../../../services/api/observability";

// ─── useEvaluationRuns ───────────────────────────────────────────────────

export function useEvaluationRuns() {
  return useQuery<EvaluationRun[]>({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const data = await observabilityApi.getEvaluations();
      return data.runs;
    },
  });
}

// ─── useRunEvaluation ─────────────────────────────────────────────────────

export function useRunEvaluation() {
  return useMutation({
    mutationKey: ["evaluations", "run"],
    mutationFn: observabilityApi.runEvaluation,
  });
}

// ─── useFeedbackStats ────────────────────────────────────────────────────

export function useFeedbackStats() {
  return useQuery<FeedbackStats>({
    queryKey: ["feedback", "stats"],
    queryFn: observabilityApi.getFeedbackStats,
  });
}

// ─── useCostSummary ──────────────────────────────────────────────────────

export function useCostSummary() {
  return useQuery<CostSummary>({
    queryKey: ["costs", "summary"],
    queryFn: observabilityApi.getCostSummary,
  });
}

// ─── useAuditLog ─────────────────────────────────────────────────────────

export function useAuditLog(filters: AuditFilters = {}) {
  return useQuery<PaginatedAuditEvents>({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const data = await observabilityApi.getAuditLog(filters);
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
    queryFn: observabilityApi.exportAuditCsv,
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
