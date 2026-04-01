import { useSettingsStore } from "../../settings/store";
import { Brain } from "lucide-react";

interface MemoryIndicatorProps {
  /** Number of messages in the current conversation (user + assistant pairs) */
  messageCount: number;
}

export function MemoryIndicator({ messageCount }: MemoryIndicatorProps) {
  const memoryWindow = useSettingsStore((s) => s.settings.memoryWindow);

  // Only show when there is prior history
  if (messageCount < 1) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
      title={`Memory window: ${memoryWindow} message${memoryWindow !== 1 ? "s" : ""}`}
    >
      <Brain className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>Memory active</span>
      <span className="font-medium tabular-nums">{messageCount}</span>
    </div>
  );
}
