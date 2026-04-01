import { HelpCircle } from "lucide-react";

interface NoAnswerStateProps {
  reason?: string;
  className?: string;
}

const REASON_LABELS: Record<string, string> = {
  retrieval_score_below_threshold:
    "No relevant documents found above confidence threshold",
  no_documents_queried: "No documents available — upload files first",
  guardrails_blocked: "Response withheld by content safety policy",
};

export function NoAnswerState({ reason, className = "" }: NoAnswerStateProps) {
  const label = reason
    ? (REASON_LABELS[reason] ?? reason)
    : "Insufficient context to answer";
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 px-6 py-5 text-center ${className}`}
    >
      <HelpCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm italic text-muted-foreground">{label}</p>
    </div>
  );
}
