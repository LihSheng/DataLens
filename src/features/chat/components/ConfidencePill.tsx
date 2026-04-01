import type { ConfidenceLevel } from "../../../types";

interface ConfidencePillProps {
  level: ConfidenceLevel;
  className?: string;
}

const CONFIG: Record<ConfidenceLevel, { label: string; classes: string }> = {
  high: {
    label: "High",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  medium: {
    label: "Medium",
    classes:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  low: {
    label: "Low",
    classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
};

export function ConfidencePill({ level, className = "" }: ConfidencePillProps) {
  const { label, classes } = CONFIG[level];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes} ${className}`}
      title={`Confidence: ${label}`}
    >
      {label}
    </span>
  );
}
