import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import {
  ObservabilityTabs,
  type ObservabilityTab,
} from "../features/observability/components/ObservabilityTabs";
import { GoldenDatasetTable } from "../features/observability/components/GoldenDatasetTable";
import { RunEvaluationButton } from "../features/observability/components/RunEvaluationButton";
import { FeedbackStatsCard } from "../features/observability/components/FeedbackStatsCard";
import { CostSummaryCards } from "../features/observability/components/CostSummaryCards";
import { AuditTable } from "../features/observability/components/AuditTable";
import {
  useEvaluationRuns,
  useFeedbackStats,
  useCostSummary,
  useAuditLog,
} from "../features/observability/hooks";
import type { AuditFilters } from "../types/observability";
import { useAuthStore } from "../features/auth/store";

export function ObservabilityPage() {
  const [activeTab, setActiveTab] = useState<ObservabilityTab>("evaluation");
  const [auditFilters, setAuditFilters] = useState<AuditFilters>({});

  // All hooks called unconditionally — no early conditional returns above this line
  const user = useAuthStore((s) => s.user);
  const evaluations = useEvaluationRuns();
  const feedbackStats = useFeedbackStats();
  const costSummary = useCostSummary();
  const auditLog = useAuditLog(auditFilters);

  // Admin guard — non-admins see locked screen
  if (user?.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Admin Access Required</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You need admin privileges to view observability data.
          </p>
        </div>
      </div>
    );
  }

  async function handleExportAudit() {
    const res = await fetch("/api/audit/export?format=csv");
    const csv = await res.text();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_log.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="px-8 py-6 border-b">
        <h1 className="text-2xl font-semibold text-foreground">
          Observability
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor system health, feedback, costs, and audit events.
        </p>
      </div>

      {/* Tabs */}
      <ObservabilityTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === "evaluation" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Golden Dataset Evaluation
                </h2>
                <p className="text-sm text-muted-foreground">
                  Track answer quality against expected golden answers.
                </p>
              </div>
              <RunEvaluationButton />
            </div>
            <GoldenDatasetTable
              runs={evaluations.data ?? []}
              isLoading={evaluations.isLoading}
            />
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Feedback Overview</h2>
              <p className="text-sm text-muted-foreground">
                Positive vs negative feedback ratio and trend signals.
              </p>
            </div>
            <FeedbackStatsCard
              stats={feedbackStats.data}
              isLoading={feedbackStats.isLoading}
            />
          </div>
        )}

        {activeTab === "cost" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Cost Summary</h2>
              <p className="text-sm text-muted-foreground">
                Track spend by model and user over the reporting period.
              </p>
            </div>
            <CostSummaryCards
              summary={costSummary.data}
              isLoading={costSummary.isLoading}
            />
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Audit Log</h2>
              <p className="text-sm text-muted-foreground">
                Search and export security and operational events.
              </p>
            </div>
            <AuditTable
              data={auditLog.data}
              filters={auditFilters}
              isLoading={auditLog.isLoading}
              onFiltersChange={setAuditFilters}
              onExport={handleExportAudit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
