import { Badge } from "../../../components/ui/Badge";

interface InfoBadgeProps {
  label: string;
  variant?: "info" | "warning" | "destructive";
}

export function InfoBadge({ label, variant = "info" }: InfoBadgeProps) {
  return (
    <Badge
      variant={
        variant === "destructive"
          ? "destructive"
          : variant === "warning"
            ? "warning"
            : "default"
      }
      className="text-[10px] py-0"
    >
      {label}
    </Badge>
  );
}
