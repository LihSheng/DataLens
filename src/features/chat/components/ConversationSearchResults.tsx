import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { useChatStore } from "../store";
import type { ConversationSearchResult } from "../../../types";

interface ConversationSearchResultsProps {
  results: ConversationSearchResult[];
  isLoading: boolean;
  isError: boolean;
  query: string;
}

export function ConversationSearchResults({
  results,
  isLoading,
  isError,
  query,
}: ConversationSearchResultsProps) {
  const setActiveConversationId = useChatStore(
    (s) => s.setActiveConversationId,
  );
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    setActiveConversationId(id);
    navigate(`/`);
  };

  if (!query.trim()) return null;

  if (isLoading) {
    return (
      <div className="px-2 py-2">
        <div className="flex justify-center py-4">
          <Loader variant="spinner" className="h-4 w-4" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-2 py-2">
        <p className="text-xs text-muted-foreground text-center py-2">
          Search failed. Try again.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-2 py-2">
        <EmptyState
          icon={MessageSquare}
          title="No results"
          description={`No conversations matching "${query}"`}
        />
      </div>
    );
  }

  return (
    <div className="px-1 py-1">
      <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        Results
      </p>
      <div className="space-y-0.5">
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => handleSelect(result.id)}
            className="w-full flex items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {result.title}
              </p>
              {result.snippet && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {result.snippet}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
