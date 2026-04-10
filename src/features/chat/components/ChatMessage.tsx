import { CopyButton } from "./CopyButton";
import { CitationChip } from "./CitationChip";
import { ConfidencePill } from "./ConfidencePill";
import { GroundingIndicator } from "./GroundingIndicator";
import { CachePill } from "./CachePill";
import { ModelBadge } from "./ModelBadge";
import { LatencyBadge } from "./LatencyBadge";
import { TokenUsageBadge } from "./TokenUsageBadge";
import { TraceLink } from "./TraceLink";
import { NoAnswerState } from "./NoAnswerState";
import { FeedbackButtons } from "./FeedbackButtons";
import { useChatStore } from "../store";
import type { Message, CitationValidity } from "../../../types";

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

export function ChatMessage({ message }: { message: Message }) {
  const streamState = useChatStore((s) => s.streamState);
  const isStreaming = streamState?.messageId === message.id;
  const displayText = isStreaming ? streamState!.buffer : message.content;
  const showCursor = isStreaming && streamState?.status === "streaming";
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
              displayText,
              message.sources,
              message.citationValidity,
            )
          )}
          {/* Running dot during stream */}
          {showCursor && (
            <span
              className="flex h-2 items-center gap-0.5 ml-1 mb-0.5"
              aria-hidden="true"
            >
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary" />
            </span>
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
            {(message.traceMetadata?.latencyMs ?? message.latencyMs) && (
              <LatencyBadge
                latencyMs={
                  message.traceMetadata?.latencyMs ?? message.latencyMs!
                }
              />
            )}
            {message.traceMetadata?.tokens != null && (
              <TokenUsageBadge tokens={message.traceMetadata.tokens} />
            )}
            {message.traceMetadata?.traceId && (
              <TraceLink traceId={message.traceMetadata.traceId} />
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {time}
            </span>
          </div>
        )}

        {/* Feedback buttons — assistant only, after badges, before timestamp */}
        {!isUser && !isStreaming && (
          <div className="px-1">
            <FeedbackButtons message={message} />
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
