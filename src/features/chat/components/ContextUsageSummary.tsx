import { AlertTriangle } from "lucide-react";
import type { TokenUsage } from "../../../types";

interface ContextUsageSummaryProps {
  tokenUsage: TokenUsage;
  className?: string;
}

export function ContextUsageSummary({
  tokenUsage,
  className = "",
}: ContextUsageSummaryProps) {
  const { used, available, chunksIncluded, chunksAvailable } = tokenUsage;
  const dropped = chunksAvailable - chunksIncluded;
  const pct = available > 0 ? Math.min((used / available) * 100, 100) : 0;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Context used</span>
        <span>
          {used.toLocaleString()} / {available.toLocaleString()} tokens (
          {pct.toFixed(0)}%)
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Chunks</span>
        <span>
          {chunksIncluded} of {chunksAvailable} included
        </span>
      </div>
      {dropped > 0 && (
        <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            {dropped} chunk{dropped !== 1 ? "s" : ""} dropped due to token
            budget
          </span>
        </div>
      )}
    </div>
  );
}
