import { CheckCircle, XCircle } from "lucide-react";
import type { EvaluationRun } from "../../../types/observability";
import { cn } from "../../../lib/utils";

interface GoldenDatasetTableProps {
  runs: EvaluationRun[];
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatScore(score: number): string {
  return (score * 100).toFixed(0) + "%";
}

export function GoldenDatasetTable({
  runs,
  isLoading,
}: GoldenDatasetTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Question</th>
              <th className="px-4 py-3 text-left font-medium">Last Score</th>
              <th className="px-4 py-3 text-left font-medium">Threshold</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Evaluated At</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[0, 1, 2].map((i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card">
        <p className="text-sm text-muted-foreground">No evaluation runs yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Run an evaluation to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Question</th>
            <th className="px-4 py-3 text-left font-medium">Last Score</th>
            <th className="px-4 py-3 text-left font-medium">Threshold</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Evaluated At</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {runs.map((run) => (
            <tr
              key={run.traceId}
              className="hover:bg-muted/30 transition-colors"
            >
              <td className="px-4 py-3 font-medium">{run.question}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "font-medium",
                    run.passed ? "text-green-600" : "text-red-600",
                  )}
                >
                  {formatScore(run.lastScore)}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatScore(run.threshold)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    run.passed
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  )}
                >
                  {run.passed ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {run.passed ? "Pass" : "Fail"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(run.evaluatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
