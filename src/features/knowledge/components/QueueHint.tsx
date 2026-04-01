interface QueueHintProps {
  queuePosition?: number;
}

export function QueueHint({ queuePosition }: QueueHintProps) {
  if (!queuePosition) return null;
  return (
    <span className="text-[10px] text-amber-600 dark:text-amber-400">
      #{queuePosition} in queue
    </span>
  );
}
