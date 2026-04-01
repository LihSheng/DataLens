interface CachePillProps {
  className?: string;
}

export function CachePill({ className = "" }: CachePillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 ${className}`}
      title="This answer was retrieved from cache"
    >
      Cached
    </span>
  );
}
