import type { DocumentStatus } from "../../../types";
import { Badge } from "../../../components/ui/Badge";
import { Loader2 } from "lucide-react";

interface StatusBadgeProps {
  status: DocumentStatus;
}

const statusConfig: Record<
  DocumentStatus,
  { variant: "success" | "warning" | "destructive"; label: string }
> = {
  ready: { variant: "success", label: "Ready" },
  processing: { variant: "warning", label: "Processing" },
  failed: { variant: "destructive", label: "Failed" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { variant, label } = statusConfig[status];
  return (
    <Badge variant={variant} className="gap-1">
      {status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
      {label}
    </Badge>
  );
}
