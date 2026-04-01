import { CopyButton } from "./CopyButton";
import { CitationChip } from "./CitationChip";
import type { Message } from "../../../types";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

function renderContentWithCitations(
  content: string,
  sources?: Message["sources"],
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
        />,
      );
    } else {
      parts.push(
        <span key={`citation-${match.index}`} className="text-muted-foreground">
          [{match[1]}]
        </span>,
      );
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
          {renderContentWithCitations(message.content, message.sources)}
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
        <span className="px-1 text-xs text-muted-foreground">{time}</span>
      </div>
    </div>
  );
}
