interface RelevanceScoreBadgeProps {
  /** Raw similarity score (0–1). */
  score: number;
  /** Cross-encoder rerank score, if available. Prefer this over raw score. */
  rerankScore?: number;
  className?: string;
}

export function RelevanceScoreBadge({
  score,
  rerankScore,
  className = "",
}: RelevanceScoreBadgeProps) {
  const value = rerankScore ?? score;
  const isRerank = rerankScore !== undefined;
  const colorClass =
    value >= 0.8
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      : value >= 0.6
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass} ${className}`}
      title={
        isRerank
          ? `Rerank score: ${Math.round(value * 100)}%`
          : `Similarity score: ${Math.round(value * 100)}%`
      }
    >
      {isRerank ? "Rerank: " : ""}
      {Math.round(value * 100)}%
    </span>
  );
}
