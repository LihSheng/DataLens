import { Check } from "lucide-react";

export function FeedbackSubmittedState() {
  return (
    <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
      <Check className="h-3 w-3 text-green-500" />
      <span>Thank you for your feedback!</span>
    </div>
  );
}
