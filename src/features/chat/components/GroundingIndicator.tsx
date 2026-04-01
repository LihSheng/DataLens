import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { GroundingInfo } from "../../../types";

interface GroundingIndicatorProps {
  grounding: GroundingInfo;
  className?: string;
}

export function GroundingIndicator({
  grounding,
  className = "",
}: GroundingIndicatorProps) {
  if (grounding.fully_grounded) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 ${className}`}
        title="All claims are supported by retrieved documents"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Grounded
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ${className}`}
      title={
        grounding.unsupported_sentences?.length
          ? `Unverified claims:\n${grounding.unsupported_sentences.join("\n")}`
          : `${grounding.unsupported_count} unverified claim${grounding.unsupported_count !== 1 ? "s" : ""}`
      }
    >
      <ShieldAlert className="h-3.5 w-3.5" />
      {grounding.unsupported_count} unverified
    </span>
  );
}
