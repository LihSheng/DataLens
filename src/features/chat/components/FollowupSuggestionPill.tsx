import { Sparkles } from "lucide-react";

interface FollowupSuggestionPillProps {
  suggestion: string;
  onClick: (suggestion: string) => void;
  animationDelay?: number;
}

export function FollowupSuggestionPill({
  suggestion,
  onClick,
  animationDelay = 0,
}: FollowupSuggestionPillProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(suggestion)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-sm transition-all hover:border-primary hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-followup-pill"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <Sparkles className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="text-left">{suggestion}</span>
    </button>
  );
}
