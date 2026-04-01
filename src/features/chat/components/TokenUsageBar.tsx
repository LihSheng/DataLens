interface TokenUsageBarProps {
  used: number;
  available: number;
  className?: string;
}

export function TokenUsageBar({
  used,
  available,
  className = "",
}: TokenUsageBarProps) {
  const pct = available > 0 ? Math.min((used / available) * 100, 100) : 0;
  const colorClass =
    pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div
      className={`h-1 w-full rounded-full bg-muted overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={used}
      aria-valuemin={0}
      aria-valuemax={available}
      title={`Context usage: ${pct.toFixed(0)}%`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
