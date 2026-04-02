interface LatencyBadgeProps {
  latencyMs: number;
  className?: string;
}

function getLatencyColor(ms: number): string {
  if (ms < 500)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
  if (ms <= 1500)
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function LatencyBadge({ latencyMs, className = "" }: LatencyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getLatencyColor(latencyMs)} ${className}`}
      title={`Response time: ${latencyMs}ms`}
    >
      {formatLatency(latencyMs)}
    </span>
  );
}
