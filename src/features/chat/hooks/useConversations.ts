import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../../../services/api/chat";
import { useChatStore } from "../store";
import { useUIStore } from "../../../store/uiStore";
import type { Conversation } from "../../../types";

export const CONVERSATIONS_KEY = ["conversations"] as const;
const MESSAGES_KEY = (conversationId: string) =>
  ["conversations", conversationId, "messages"] as const;

export function useConversations() {
  const queryClient = useQueryClient();
  const { setConversations, addConversation, setActiveConversation } =
    useChatStore();
  const pushToast = useUIStore((s) => s.pushToast);

  const query = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: chatApi.getConversations,
  });

  // Sync React Query data to Zustand store
  useEffect(() => {
    if (query.data) {
      setConversations(query.data);
    }
  }, [query.data, setConversations]);

  const createMutation = useMutation({
    mutationFn: (title?: string) => chatApi.createConversation(title),
    onSuccess: (newConversation: Conversation) => {
      addConversation(newConversation);
      setActiveConversation(newConversation.id);
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      chatApi.renameConversation(id, title),
    onMutate: async ({ id, title }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_KEY });
      // Snapshot previous value
      const previous =
        queryClient.getQueryData<Conversation[]>(CONVERSATIONS_KEY);
      // Optimistically update
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_KEY, (old) =>
        old ? old.map((c) => (c.id === id ? { ...c, title } : c)) : [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<Conversation[]>(
          CONVERSATIONS_KEY,
          context.previous,
        );
      }
      pushToast({ message: "Failed to rename conversation.", type: "error" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_KEY });
      // Snapshot previous value
      const previous =
        queryClient.getQueryData<Conversation[]>(CONVERSATIONS_KEY);
      const previousActiveConversationId =
        useChatStore.getState().activeConversationId;
      const remainingConversations = previous
        ? previous.filter((c) => c.id !== id)
        : [];
      // Optimistically remove
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_KEY, (old) =>
        old ? old.filter((c) => c.id !== id) : [],
      );
      // If deleting the active conversation, clear selection and messages
      if (previousActiveConversationId === id) {
        setActiveConversation(remainingConversations[0]?.id ?? null);
        useChatStore.getState().clearMessages(id);
      }
      return { previous, previousActiveConversationId };
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: MESSAGES_KEY(id) });
      pushToast({ message: "Conversation deleted.", type: "success" });
    },
    onError: (_err, id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<Conversation[]>(
          CONVERSATIONS_KEY,
          context.previous,
        );
      }
      if (context?.previousActiveConversationId === id) {
        setActiveConversation(id);
      }
      pushToast({ message: "Failed to delete conversation.", type: "error" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  return {
    ...query,
    createConversation: createMutation.mutate,
    isCreating: createMutation.isPending,
    renameConversation: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
    deleteConversation: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
