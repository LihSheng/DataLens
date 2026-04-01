import type { DocumentStatus } from "../../../types";
import { Badge } from "../../../components/ui/Badge";
import { Loader2 } from "lucide-react";
import { QueueHint } from "./QueueHint";

interface StatusBadgeProps {
  status: DocumentStatus;
  parseError?: string;
  queuePosition?: number;
}

const statusConfig: Record<
  DocumentStatus,
  { variant: "success" | "warning" | "destructive"; label: string }
> = {
  ready: { variant: "success", label: "Ready" },
  processing: { variant: "warning", label: "Processing" },
  failed: { variant: "destructive", label: "Failed" },
};

export function StatusBadge({
  status,
  parseError,
  queuePosition,
}: StatusBadgeProps) {
  const { variant, label } = statusConfig[status];
  return (
    <div className="flex flex-col gap-0.5 items-start">
      <Badge
        variant={variant}
        className="gap-1"
        title={status === "failed" && parseError ? parseError : undefined}
      >
        {status === "processing" && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        {label}
      </Badge>
      {status === "processing" && queuePosition && (
        <QueueHint queuePosition={queuePosition} />
      )}
    </div>
  );
}
