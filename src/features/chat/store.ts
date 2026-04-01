import { create } from "zustand";
import type { ChatFilters, Conversation, Message } from "../../types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // keyed by conversationId
  isStreaming: boolean;
  activeFilters: ChatFilters;
  draftMessage: string;
  visibleFollowupMessageId: string | null;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateStreamingMessage: (
    conversationId: string,
    messageId: string,
    content: string,
    suggestedFollowups?: string[],
  ) => void;
  setIsStreaming: (streaming: boolean) => void;
  clearMessages: (conversationId: string) => void;
  setActiveFilters: (filters: ChatFilters) => void;
  clearActiveFilters: () => void;
  setDraftMessage: (message: string) => void;
  setVisibleFollowupMessageId: (messageId: string | null) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isStreaming: false,
  activeFilters: {},
  draftMessage: "",
  visibleFollowupMessageId: null,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((s) => ({
      conversations: [conversation, ...s.conversations],
    })),

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((s) => ({
      messages: { ...s.messages, [conversationId]: messages },
    })),

  addMessage: (conversationId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), message],
      },
    })),

  updateStreamingMessage: (conversationId, messageId, content, suggestedFollowups) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
          m.id === messageId
            ? {
                ...m,
                content,
                ...(suggestedFollowups !== undefined && {
                  suggestedFollowups,
                }),
              }
            : m,
        ),
      },
    })),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  clearMessages: (conversationId) =>
    set((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit key via destructuring
      const { [conversationId]: _omit, ...rest } = s.messages;
      return { messages: rest };
    }),

  setActiveFilters: (filters) => set({ activeFilters: filters }),

  clearActiveFilters: () => set({ activeFilters: {} }),

  setDraftMessage: (message) => set({ draftMessage: message }),

  setVisibleFollowupMessageId: (messageId) =>
    set({ visibleFollowupMessageId: messageId }),
}));
