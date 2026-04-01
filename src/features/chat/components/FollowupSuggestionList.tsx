import { FollowupSuggestionPill } from "./FollowupSuggestionPill";

interface FollowupSuggestionListProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const PILL_STAGGER_DELAY_MS = 80;

export function FollowupSuggestionList({
  suggestions,
  onSuggestionClick,
}: FollowupSuggestionListProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2 py-2"
      role="list"
      aria-label="Suggested follow-up questions"
    >
      {suggestions.map((suggestion, index) => (
        <FollowupSuggestionPill
          key={`${suggestion}-${index}`}
          suggestion={suggestion}
          onClick={onSuggestionClick}
          animationDelay={index * PILL_STAGGER_DELAY_MS}
        />
      ))}
    </div>
  );
}
