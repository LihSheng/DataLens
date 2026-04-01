import {
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { FeedbackStats } from "../../../types/observability";
import { cn } from "../../../lib/utils";

interface FeedbackStatsCardProps {
  stats: FeedbackStats | undefined;
  isLoading?: boolean;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === "down")
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-4",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function FeedbackStatsCard({
  stats,
  isLoading,
}: FeedbackStatsCardProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border bg-card p-4"
          >
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              <div className="h-5 w-12 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Feedback"
          value={stats.total.toLocaleString()}
          icon={ThumbsUp}
        />
        <StatCard
          label="Positive"
          value={`${stats.positive.toLocaleString()} (${(stats.positiveRatio * 100).toFixed(0)}%)`}
          icon={ThumbsUp}
          className="border-green-200 dark:border-green-900"
        />
        <StatCard
          label="Negative"
          value={`${stats.negative.toLocaleString()} (${(stats.negativeRatio * 100).toFixed(0)}%)`}
          icon={ThumbsDown}
          className="border-red-200 dark:border-red-900"
        />
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <TrendIcon trend={stats.trend} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trend</p>
            <p className="text-xl font-semibold capitalize">{stats.trend}</p>
          </div>
        </div>
      </div>

      {/* Ratio bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Positive</span>
          <span>Negative</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-red-200 dark:bg-red-900/50">
          <div
            className="flex bg-green-200 dark:bg-green-900/50 transition-all"
            style={{ width: `${stats.positiveRatio * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{(stats.positiveRatio * 100).toFixed(0)}%</span>
          <span>{(stats.negativeRatio * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Trend chart placeholder */}
      <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          📈 Trend chart coming soon — showing weekly positive/negative ratio
          over time
        </p>
      </div>
    </div>
  );
}
