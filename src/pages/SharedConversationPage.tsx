import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "../services/httpClient";
import { Loader } from "../components/Loader";
import { EmptyState } from "../components/EmptyState";
import { MessageSquare, RefreshCw } from "lucide-react";
import { ChatMessage } from "../features/chat/components/ChatMessage";
import type { SharedConversation } from "../types";

export function SharedConversationPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["share", token],
    queryFn: async () => {
      const res = await httpClient.get<SharedConversation>(
        `/api/share/${token}`,
      );
      return res.data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader variant="spinner" className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={MessageSquare}
          title="Shared conversation not found"
          description="This link may be invalid or expired."
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
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col pt-16 lg:pt-0">
      {/* Read-only banner */}
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">
          👁 Read-only shared conversation
        </span>
      </div>

      {/* Conversation title header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 min-h-[52px]">
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <h1 className="truncate text-sm font-semibold text-foreground">
          {data.title}
        </h1>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {data.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Empty conversation"
              description="This conversation has no messages."
            />
          </div>
        ) : (
          data.messages.map((msg) => (
            <div key={msg.id} className="mb-4 last:mb-0">
              <ChatMessage message={msg} isStreaming={false} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
