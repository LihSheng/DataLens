import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/store";
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
  const accessToken = useAuthStore((s) => s.accessToken);
  const pushToast = useUIStore((s) => s.pushToast);

  return useMutation({
    mutationFn: async (params: SubmitFeedbackParams) => {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`);
      }

      return response.json();
    },
    onError: (error: Error) => {
      pushToast({
        message: `Failed to submit feedback: ${error.message}`,
        type: "error",
      });
    },
  });
}
