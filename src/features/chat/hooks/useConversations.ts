import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../../../services/api/chat";
import { useChatStore } from "../store";
import { useUIStore } from "../../../store/uiStore";
import type { Conversation } from "../../../types";

export const CONVERSATIONS_KEY = ["conversations"] as const;

export function useConversations() {
  const queryClient = useQueryClient();
  const {
    setConversations,
    addConversation,
    activeConversationId,
    setActiveConversationId,
  } = useChatStore();
  const addToast = useUIStore((s) => s.addToast);

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
      addToast("Failed to rename conversation.", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onMutate: (id) => {
      // Cancel any outgoing refetches
      queryClient.cancelQueries({ queryKey: CONVERSATIONS_KEY });
      // Snapshot previous value
      const previous =
        queryClient.getQueryData<Conversation[]>(CONVERSATIONS_KEY);
      // Optimistically remove
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_KEY, (old) =>
        old ? old.filter((c) => c.id !== id) : [],
      );
      // If deleting the active conversation, clear selection
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<Conversation[]>(
          CONVERSATIONS_KEY,
          context.previous,
        );
      }
      addToast("Failed to delete conversation.", "error");
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
