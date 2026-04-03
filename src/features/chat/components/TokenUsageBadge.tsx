interface TokenUsageBadgeProps {
  /** Total token count from traceMetadata.tokens */
  tokens: number;
  className?: string;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function TokenUsageBadge({
  tokens,
  className = "",
}: TokenUsageBadgeProps) {
  if (tokens === 0) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 ${className}`}
      title={`${tokens.toLocaleString()} tokens used`}
    >
      {formatTokens(tokens)} tok
    </span>
  );
}
