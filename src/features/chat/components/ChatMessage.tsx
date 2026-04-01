import { CopyButton } from "./CopyButton";
import { CitationChip } from "./CitationChip";
import { ConfidencePill } from "./ConfidencePill";
import { GroundingIndicator } from "./GroundingIndicator";
import { CachePill } from "./CachePill";
import { ModelBadge } from "./ModelBadge";
import { NoAnswerState } from "./NoAnswerState";
import type { Message, CitationValidity } from "../../../types";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

function isCitationInvalid(
  citationValidity: CitationValidity[] | undefined,
  index: number,
): boolean {
  if (!citationValidity) return false;
  const entry = citationValidity.find((v) => v.citation === `[${index + 1}]`);
  return entry ? !entry.valid : false;
}

function renderContentWithCitations(
  content: string,
  sources?: Message["sources"],
  citationValidity?: CitationValidity[],
) {
  if (!sources || sources.length === 0) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
    );
  }

  const citationPattern = /\[(\d+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationPattern.exec(content)) !== null) {
    const index = parseInt(match[1], 10) - 1;
    const source = sources[index];
    const invalid = isCitationInvalid(citationValidity, index);

    if (lastIndex < match.index) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.slice(lastIndex, match.index)}
        </span>,
      );
    }

    if (source) {
      parts.push(
        <CitationChip
          key={`citation-${match.index}`}
          index={index}
          sourceId={source.id ?? `${source.documentId}_${index}`}
          valid={!invalid}
        />,
      );
    } else {
      <span
        key={`citation-${match.index}`}
        className={
          invalid
            ? "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 mx-0.5"
            : "text-muted-foreground"
        }
      >
        [{match[1]}]
      </span>;
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>,
    );
  }

  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{parts}</p>;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isNoAnswer = !!message.noAnswerReason;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[75%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`flex items-end gap-2 rounded-2xl px-4 py-2.5 ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          }`}
        >
          {isNoAnswer ? (
            <NoAnswerState
              reason={message.noAnswerReason}
              className="w-full max-w-sm"
            />
          ) : (
            renderContentWithCitations(
              message.content,
              message.sources,
              message.citationValidity,
            )
          )}
          {/* Blinking cursor during stream */}
          {isStreaming && (
            <span
              className="inline-block h-4 w-0.5 bg-primary animate-pulse ml-1 mb-0.5"
              aria-hidden="true"
            />
          )}
          {!isUser && !isStreaming && (
            <CopyButton text={message.content} className="shrink-0" />
          )}
        </div>

        {/* Trust signal badges — assistant only */}
        {!isUser && !isStreaming && (
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            {message.confidence && (
              <ConfidencePill level={message.confidence} />
            )}
            {message.grounding && (
              <GroundingIndicator grounding={message.grounding} />
            )}
            {message.cacheHit && <CachePill />}
            {message.routedToModel && (
              <ModelBadge model={message.routedToModel} />
            )}
            {message.latencyMs && (
              <span className="text-xs text-muted-foreground">
                {message.latencyMs < 1000
                  ? `${message.latencyMs}ms`
                  : `${(message.latencyMs / 1000).toFixed(1)}s`}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {time}
            </span>
          </div>
        )}

        {/* Timestamp for user messages / streaming */}
        {(isUser || isStreaming) && (
          <span className="px-1 text-xs text-muted-foreground">{time}</span>
        )}
      </div>
    </div>
  );
}
