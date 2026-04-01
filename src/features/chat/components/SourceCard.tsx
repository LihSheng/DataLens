import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { RelevanceScoreBadge } from "./RelevanceScoreBadge";
import { useUIStore } from "../../../store/uiStore";
import type { Source } from "../../../types";

interface SourceCardProps {
  source: Source;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { highlightedSourceId, setHighlightedSourceId } = useUIStore();

  const sourceKey = source.id ?? `${source.documentId}_${index}`;
  const isHighlighted = highlightedSourceId === sourceKey;

  const handleToggle = () => {
    setExpanded((v) => !v);
    setHighlightedSourceId(sourceKey);
    setTimeout(() => setHighlightedSourceId(null), 1000);
  };

  const preview =
    source.chunkText.length > 200
      ? source.chunkText.slice(0, 200) + "…"
      : source.chunkText;

  return (
    <div
      id={`source-${sourceKey}`}
      className={`rounded-lg border bg-card transition-all duration-500 ${
        isHighlighted
          ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-sm"
          : "border-border"
      }`}
    >
      {/* Card header — always visible */}
      <button
        onClick={handleToggle}
        className="flex w-full items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        {/* Document icon */}
        <div className="mt-0.5 shrink-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug truncate">
              {source.documentName}
            </p>
            <RelevanceScoreBadge score={source.relevanceScore} />
          </div>
          {source.pageNumber !== undefined && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Page {source.pageNumber}
            </p>
          )}
          {!expanded && (
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {preview}
            </p>
          )}
        </div>

        {/* Expand chevron */}
        <div className="mt-0.5 shrink-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="ml-7 border-t border-border pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {source.chunkText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
