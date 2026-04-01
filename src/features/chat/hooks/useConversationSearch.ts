import { useQuery } from "@tanstack/react-query";
import { httpClient } from "../../../services/httpClient";
import type { ConversationSearchResult } from "../../../types";

export const CONVERSATION_SEARCH_KEY = (q: string) =>
  ["conversations", "search", q] as const;

export function useConversationSearch(query: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: CONVERSATION_SEARCH_KEY(query),
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await httpClient.get<ConversationSearchResult[]>(
        "/api/conversations/search",
        { params: { q: query } },
      );
      return res.data;
    },
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });

  return {
    results: data ?? [],
    isLoading,
    isError,
  };
}
