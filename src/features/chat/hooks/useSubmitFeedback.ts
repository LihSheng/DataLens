import { useMutation } from "@tanstack/react-query";
import { httpClient } from "../../../services/httpClient";
import { useUIStore } from "../../../store/uiStore";
import type { FeedbackRating } from "../../../types";

interface SubmitFeedbackParams {
  messageId: string;
  conversationId: string;
  traceId: string;
  rating: FeedbackRating;
  comment?: string;
}

export function useSubmitFeedback() {
  const pushToast = useUIStore((s) => s.pushToast);

  return useMutation({
    mutationFn: async (params: SubmitFeedbackParams) => {
      const response = await httpClient.post("/api/feedback", params);
      return response.data;
    },
    onError: (error: Error) => {
      pushToast({
        message: `Failed to submit feedback: ${error.message}`,
        type: "error",
      });
    },
  });
}
