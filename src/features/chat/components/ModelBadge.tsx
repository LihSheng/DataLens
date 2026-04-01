interface ModelBadgeProps {
  model: string;
  className?: string;
}

export function ModelBadge({ model, className = "" }: ModelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 ${className}`}
      title={`Routed to ${model}`}
    >
      {model}
    </span>
  );
}
