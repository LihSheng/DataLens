import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../../../services/api/chat";
import { useChatStore } from "../store";
import { useAuthStore } from "../../auth/store";
import { useUIStore } from "../../../store/uiStore";
import type { Message } from "../../../types";

const MESSAGES_KEY = (conversationId: string) =>
  ["conversations", conversationId, "messages"] as const;

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: MESSAGES_KEY(conversationId ?? ""),
    queryFn: () => chatApi.getMessages(conversationId!),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const {
    addMessage,
    updateStreamingMessage,
    setIsStreaming,
    activeConversationId,
  } = useChatStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const addToast = useUIStore((s) => s.addToast);

  const mutation = useMutation({
    mutationFn: async (params: {
      conversationId?: string;
      message: string;
    }) => {
      const currentConversationId =
        params.conversationId ?? activeConversationId ?? "conv_new";

      // Optimistically add user message
      const optimisticUserMessage: Message = {
        id: `optimistic_${Date.now()}`,
        conversationId: currentConversationId,
        role: "user",
        content: params.message,
        createdAt: new Date().toISOString(),
      };
      addMessage(currentConversationId, optimisticUserMessage);

      setIsStreaming(true);

      // Start streaming response
      const assistantMessageId = `stream_${Date.now()}`;
      let assistantContent = "";
      const sources: Message["sources"] = [];

      const stream = chatApi.sendMessage(params, accessToken);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw = decoder.decode(value, { stream: true });
          // value is a JSON string of the SSE data
          let data: {
            content?: string;
            sources?: Message["sources"];
            id?: string;
            role?: string;
            createdAt?: string;
          };
          try {
            data = JSON.parse(raw.trim());
          } catch {
            continue;
          }

          if (data.content !== undefined) {
            assistantContent += data.content;
            updateStreamingMessage(
              currentConversationId,
              assistantMessageId,
              assistantContent,
            );
          }
          if (data.sources) {
            // Assign stable ids to sources for citation linking
            const indexedSources = data.sources.map((s, i) => ({
              ...s,
              id: `${s.documentId}_${i}`,
            }));
            sources.push(...indexedSources);
          }
        }
      } finally {
        setIsStreaming(false);
        reader.releaseLock();
      }

      // Replace optimistic with real assistant message
      const realAssistantMessage: Message = {
        id: assistantMessageId,
        conversationId: currentConversationId,
        role: "assistant",
        content: assistantContent,
        sources: sources.length > 0 ? sources : undefined,
        createdAt: new Date().toISOString(),
      };

      // Invalidate messages so they re-fetch from MSW cache
      queryClient.invalidateQueries({
        queryKey: MESSAGES_KEY(currentConversationId),
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      return realAssistantMessage;
    },
    onError: (error: Error) => {
      setIsStreaming(false);
      addToast(`Failed to send message: ${error.message}`, "error");
    },
  });

  const send = useCallback(
    (params: { conversationId?: string; message: string }) => {
      mutation.mutate(params);
    },
    [mutation],
  );

  return {
    send,
    isStreaming: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
