import { useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../../../services/api/chat";
import { useChatStore } from "../store";
import { useAuthStore } from "../../auth/store";
import { useUIStore } from "../../../store/uiStore";
import type { Message, TraceMetadata } from "../../../types";

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
    addOptimisticUserMessage,
    appendMessage,
    startStream,
    appendStreamChunk,
    finaliseStream,
    failStream,
    cancelStream,
    activeConversationId,
    activeFilters,
    updateConversationTitle,
  } = useChatStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const pushToast = useUIStore((s) => s.pushToast);
  const openSourcePanel = useUIStore((s) => s.openSourcePanel);
  const highlightSource = useUIStore((s) => s.highlightSource);
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (params: {
      conversationId?: string;
      message: string;
    }) => {
      const currentConversationId =
        params.conversationId ?? activeConversationId ?? "conv_new";

      // Optimistically add user message
      addOptimisticUserMessage(currentConversationId, params.message);

      // Start streaming response
      const assistantMessageId = crypto.randomUUID();
      appendMessage(currentConversationId, {
        id: assistantMessageId,
        conversationId: currentConversationId,
        role: "assistant",
        content: "",
        status: "streaming",
        sources: [],
        createdAt: new Date().toISOString(),
      });
      startStream(currentConversationId, assistantMessageId);
      let assistantContent = "";
      const sources: Message["sources"] = [];
      let suggestedFollowups: string[] | undefined;
      // Trust signal state
      let confidence: Message["confidence"];
      let grounding: Message["grounding"];
      let latencyMs: number | undefined;
      let cacheHit: boolean | undefined;
      let routedToModel: string | undefined;
      let noAnswerReason: string | undefined;
      let citationValidity: Message["citationValidity"];
      let tokenUsage: Message["tokenUsage"];
      let traceMetadata: TraceMetadata | undefined;

      const filters =
        activeFilters.document_ids && activeFilters.document_ids.length > 0
          ? activeFilters
          : undefined;
      abortControllerRef.current = new AbortController();
      const stream = chatApi.sendMessage(
        { ...params, filters },
        accessToken,
        abortControllerRef.current.signal,
      );
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw = decoder.decode(value, { stream: true });
          // value is a JSON string of the SSE data
          let data: {
            type?: string;
            content?: string;
            sources?: Message["sources"];
            suggestedFollowups?: string[];
            confidence?: Message["confidence"];
            grounding?: Message["grounding"];
            latencyMs?: number;
            cacheHit?: boolean;
            routedToModel?: string;
            noAnswerReason?: string;
            citationValidity?: Message["citationValidity"];
            tokenUsage?: Message["tokenUsage"];
            metadata?: TraceMetadata;
          };
          try {
            data = JSON.parse(raw.trim());
          } catch {
            continue;
          }

          if (data.content !== undefined) {
            assistantContent += data.content;
            appendStreamChunk(data.content);
          }
          if (data.sources) {
            // Assign stable ids to sources for citation linking
            const indexedSources = data.sources.map((s, i) => ({
              ...s,
              id: `${s.documentId}_${i}`,
            }));
            sources.push(...indexedSources);
          }
          if (data.suggestedFollowups)
            suggestedFollowups = data.suggestedFollowups;
          if (data.confidence) confidence = data.confidence;
          if (data.grounding) grounding = data.grounding;
          if (data.latencyMs) latencyMs = data.latencyMs;
          if (data.cacheHit) cacheHit = data.cacheHit;
          if (data.routedToModel) routedToModel = data.routedToModel;
          if (data.noAnswerReason) noAnswerReason = data.noAnswerReason;
          if (data.citationValidity) citationValidity = data.citationValidity;
          if (data.tokenUsage) tokenUsage = data.tokenUsage;
          if (data.type === "trace_metadata" && data.metadata) {
            traceMetadata = data.metadata as TraceMetadata;
          }
        }
      } finally {
        reader.releaseLock();
        abortControllerRef.current = null;
      }

      finaliseStream({
        sources: sources.length > 0 ? sources : undefined,
        suggestedFollowups,
        confidence,
        grounding,
        latencyMs,
        cacheHit,
        routedToModel,
        noAnswerReason,
        citationValidity,
        tokenUsage,
        traceMetadata,
      });

      if (sources.length > 0) {
        openSourcePanel();
        highlightSource(sources[0].id ?? `${sources[0].documentId}_0`);
      }

      // Invalidate messages so they re-fetch from MSW cache
      queryClient.invalidateQueries({
        queryKey: MESSAGES_KEY(currentConversationId),
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Fire-and-forget: auto-generate title for the conversation
      generateTitleMutation.mutate(currentConversationId);

      return assistantContent;
    },
    onError: (error: Error) => {
      if (error.name === "AbortError") {
        cancelStream();
      } else {
        failStream(error.message);
        pushToast({
          message: `Failed to send message: ${error.message}`,
          type: "error",
        });
      }
    },
  });

  const generateTitleMutation = useMutation({
    mutationFn: (conversationId: string) =>
      chatApi.generateTitle(conversationId),
    onSuccess: (updated: { id: string; title: string }) => {
      updateConversationTitle(updated.id, updated.title);
      queryClient.setQueryData(
        ["conversations"],
        (old: { id: string; title: string }[] | undefined) =>
          old?.map((c) =>
            c.id === updated.id ? { ...c, title: updated.title } : c,
          ),
      );
    },
  });

  const send = useCallback(
    (params: { conversationId?: string; message: string }) => {
      mutation.mutate(params);
    },
    [mutation],
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    send,
    isStreaming: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    cancel,
  };
}
