import { create } from "zustand";
import type { ChatFilters, Conversation, Message } from "../../types";

type StreamStatus = "streaming" | "done" | "error";

interface StreamState {
  conversationId: string;
  messageId: string;
  buffer: string;
  status: StreamStatus;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messagesByConversationId: Record<string, Message[]>; // keyed by conversationId
  streamState: StreamState | null;
  activeFilters: ChatFilters;
  draftMessage: string;
  visibleFollowupMessageId: string | null;
  submittedFeedback: Record<string, "positive" | "negative">;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  appendMessage: (conversationId: string, message: Message) => void;
  addMessage: (conversationId: string, message: Message) => void;
  addOptimisticUserMessage: (conversationId: string, text: string) => Message;
  startStream: (conversationId: string, messageId: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finaliseStream: (payload?: {
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
    traceMetadata?: Message["traceMetadata"];
  }) => void;
  failStream: (error: string) => void;
  clearMessages: (conversationId: string) => void;
  setActiveFilters: (filters: ChatFilters) => void;
  clearActiveFilters: () => void;
  setDraftMessage: (message: string) => void;
  setVisibleFollowupMessageId: (messageId: string | null) => void;
  setFeedbackSubmitted: (
    messageId: string,
    rating: "positive" | "negative",
  ) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversationId: {},
  streamState: null,
  activeFilters: {},
  draftMessage: "",
  visibleFollowupMessageId: null,
  submittedFeedback: {},

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((s) => ({
      conversations: [conversation, ...s.conversations],
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((s) => ({
      messagesByConversationId: {
        ...s.messagesByConversationId,
        [conversationId]: messages,
      },
    })),

  appendMessage: (conversationId, message) =>
    set((s) => ({
      messagesByConversationId: {
        ...s.messagesByConversationId,
        [conversationId]: [
          ...(s.messagesByConversationId[conversationId] ?? []),
          message,
        ],
      },
    })),

  addMessage: (conversationId, message) =>
    set((s) => ({
      messagesByConversationId: {
        ...s.messagesByConversationId,
        [conversationId]: [
          ...(s.messagesByConversationId[conversationId] ?? []),
          message,
        ],
      },
    })),

  addOptimisticUserMessage: (conversationId, text) => {
    const message: Message = {
      id: `optimistic_${Date.now()}`,
      conversationId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      messagesByConversationId: {
        ...s.messagesByConversationId,
        [conversationId]: [
          ...(s.messagesByConversationId[conversationId] ?? []),
          message,
        ],
      },
    }));
    return message;
  },

  startStream: (conversationId, messageId) =>
    set({
      streamState: {
        conversationId,
        messageId,
        buffer: "",
        status: "streaming",
      },
    }),

  appendStreamChunk: (chunk) =>
    set((s) => {
      if (!s.streamState) {
        return s;
      }
      return {
        streamState: {
          ...s.streamState,
          buffer: s.streamState.buffer + chunk,
        },
      };
    }),

  finaliseStream: (payload) =>
    set((s) => {
      if (!s.streamState) {
        return s;
      }
      const { conversationId, messageId, buffer } = s.streamState;
      const messages = s.messagesByConversationId[conversationId] ?? [];
      return {
        messagesByConversationId: {
          ...s.messagesByConversationId,
          [conversationId]: messages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: buffer,
                  status: "done",
                  ...(payload ?? {}),
                }
              : m,
          ),
        },
        streamState: null,
      };
    }),

  failStream: () =>
    set((s) => {
      if (!s.streamState) {
        return s;
      }
      const { conversationId, messageId } = s.streamState;
      const messages = s.messagesByConversationId[conversationId] ?? [];
      return {
        messagesByConversationId: {
          ...s.messagesByConversationId,
          [conversationId]: messages.map((m) =>
            m.id === messageId ? { ...m, content: "", status: "error" } : m,
          ),
        },
        streamState: { ...s.streamState, status: "error" },
      };
    }),

  clearMessages: (conversationId) =>
    set((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit key via destructuring
      const { [conversationId]: _omit, ...rest } = s.messagesByConversationId;
      return { messagesByConversationId: rest };
    }),

  setActiveFilters: (filters) => set({ activeFilters: filters }),

  clearActiveFilters: () => set({ activeFilters: {} }),

  setDraftMessage: (message) => set({ draftMessage: message }),

  setVisibleFollowupMessageId: (messageId) =>
    set({ visibleFollowupMessageId: messageId }),

  setFeedbackSubmitted: (messageId, rating) =>
    set((s) => ({
      submittedFeedback: { ...s.submittedFeedback, [messageId]: rating },
    })),
}));
