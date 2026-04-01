interface RelevanceScoreBadgeProps {
  score: number;
}

export function RelevanceScoreBadge({ score }: RelevanceScoreBadgeProps) {
  const colorClass =
    score >= 0.8
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      : score >= 0.6
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {Math.round(score * 100)}%
    </span>
  );
}
