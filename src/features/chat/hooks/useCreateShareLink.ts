import { useMutation } from "@tanstack/react-query";
import { httpClient } from "../../../services/httpClient";
import type { ShareLinkResponse } from "../../../types";

export function useCreateShareLink(conversationId: string) {
  const mutation = useMutation({
    mutationFn: async (): Promise<ShareLinkResponse> => {
      const res = await httpClient.post<ShareLinkResponse>(
        `/api/conversations/${conversationId}/share`,
        {},
      );
      return res.data;
    },
  });

  return mutation;
}
