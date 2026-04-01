import { useEffect, useRef, useState, useMemo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SearchScopePicker } from "./SearchScopePicker";
import { MemoryIndicator } from "./MemoryIndicator";
import { FollowupSuggestionList } from "./FollowupSuggestionList";
import { EmptyState } from "../../../components/EmptyState";
import { Loader } from "../../../components/Loader";
import { MessageSquare } from "lucide-react";
import { useChatStore } from "../store";
import { useMessages, useSendMessage } from "../hooks/useChat";
import { getFollowupsFromMessage } from "../hooks/useFollowupSuggestions";
import type { Message } from "../../../types";

interface ChatWindowProps {
  conversationId: string | null;
}

const REVEAL_DELAY_MS = 400;

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const {
    conversations,
    messages: storeMessages,
    isStreaming,
    draftMessage,
    visibleFollowupMessageId,
    setDraftMessage,
    setVisibleFollowupMessageId,
  } = useChatStore();

  const {
    data: queryMessages,
    isLoading,
    isError,
    refetch,
  } = useMessages(conversationId);

  const { send } = useSendMessage();
  const [error, setError] = useState<string | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasStreamingRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);

  // Use store messages for optimistic updates, fall back to query messages
  const messages: Message[] = useMemo(
    () =>
      conversationId
        ? (storeMessages[conversationId] ?? queryMessages ?? [])
        : [],
    [conversationId, storeMessages, queryMessages],
  );

  // Identify the streaming message id (if any)
  const streamingMessageId =
    isStreaming && messages.length > 0
      ? messages[messages.length - 1]?.id.startsWith("stream_")
        ? messages[messages.length - 1].id
        : undefined
      : undefined;

  // Delayed reveal of follow-up suggestions once streaming completes
  useEffect(() => {
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = isStreaming;

    if (wasStreaming && !isStreaming && messages.length > 0) {
      // Streaming just finished — find the last assistant message with suggestions
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");

      const suggestions = lastAssistant
        ? getFollowupsFromMessage(lastAssistant)
        : [];

      if (lastAssistant && suggestions.length > 0) {
        revealTimerRef.current = setTimeout(() => {
          setVisibleFollowupMessageId(lastAssistant.id);
        }, REVEAL_DELAY_MS);
      }
    }

    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [isStreaming, messages, setVisibleFollowupMessageId]);

  // Track if user has scrolled up
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledRef.current = distFromBottom > 80;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isStreaming && !isUserScrolledRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // Scroll to bottom when streaming starts
  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isStreaming]);

  // Reset error when conversation changes (existing pattern)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting local UI state when prop changes
    setError(null);
  }, [conversationId]);

  // Reset follow-up state when conversation changes
  useEffect(() => {
    setVisibleFollowupMessageId(null);
    setDraftMessage("");
  }, [conversationId, setVisibleFollowupMessageId, setDraftMessage]);

  const handleSend = (messageText: string) => {
    if (!messageText.trim()) return;
    setError(null);
    setVisibleFollowupMessageId(null);
    setDraftMessage("");
    try {
      send({
        conversationId: conversationId ?? undefined,
        message: messageText,
      });
    } catch {
      setError("Failed to send message. Please try again.");
    }
  };

  const handleDraftChange = (value: string) => {
    // User is typing a different message — hide any visible follow-ups
    setVisibleFollowupMessageId(null);
    setDraftMessage(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDraftMessage(suggestion);
    // Keep visibleFollowupMessageId so pills stay visible while prefilled
  };

  // Empty state: no conversation selected
  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <EmptyState
          icon={MessageSquare}
          title="Select a conversation"
          description="Choose a conversation from the sidebar or start a new one."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Conversation title header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 min-h-[52px]">
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <h1 className="truncate text-sm font-semibold text-foreground">
          {conversationId
            ? (conversations.find((c) => c.id === conversationId)?.title ??
              "Conversation")
            : "Conversation"}
        </h1>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setError(null);
              refetch();
            }}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Message thread */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader variant="spinner" className="h-6 w-6" />
          </div>
        )}

        {isError && (
          <EmptyState
            icon={MessageSquare}
            title="Failed to load messages"
            description="Could not load the conversation."
            action={
              <button
                onClick={() => refetch()}
                className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            }
          />
        )}

        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Start the conversation"
              description="Ask a question about your documents."
            />
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="mb-4 last:mb-0">
            <ChatMessage
              message={msg}
              isStreaming={isStreaming && msg.id === streamingMessageId}
            />
            {/* Follow-up suggestions below the assistant message that just streamed */}
            {msg.role === "assistant" &&
              visibleFollowupMessageId === msg.id &&
              getFollowupsFromMessage(msg).length > 0 && (
                <FollowupSuggestionList
                  suggestions={getFollowupsFromMessage(msg)}
                  onSuggestionClick={handleSuggestionClick}
                />
              )}
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        {/* SearchScopePicker + MemoryIndicator on the same row */}
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <SearchScopePicker />
          <MemoryIndicator messageCount={Math.max(0, messages.length - 1)} />
        </div>
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          draft={draftMessage}
          onDraftChange={handleDraftChange}
        />
      </div>
    </div>
  );
}
