import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useChatStore } from "../store";
import { NegativeFeedbackForm } from "./NegativeFeedbackForm";
import { FeedbackSubmittedState } from "./FeedbackSubmittedState";
import { useSubmitFeedback } from "../hooks/useSubmitFeedback";
import type { Message } from "../../../types";

interface FeedbackButtonsProps {
  message: Message;
}

type LocalState = "none" | "positive" | "negative";

export function FeedbackButtons({ message }: FeedbackButtonsProps) {
  const submittedFeedback = useChatStore((s) => s.submittedFeedback);
  const setFeedbackSubmitted = useChatStore((s) => s.setFeedbackSubmitted);

  const submitted = submittedFeedback[message.id];
  const { mutate: submitFeedback, isPending } = useSubmitFeedback();

  const [localState, setLocalState] = useState<LocalState>("none");

  // If already submitted via API, show submitted state
  if (submitted) {
    return <FeedbackSubmittedState />;
  }

  // Show negative feedback form while user is composing/updating feedback
  if (localState === "negative") {
    return (
      <NegativeFeedbackForm
        message={message}
        onSubmit={(comment) => {
          submitFeedback(
            {
              messageId: message.id,
              conversationId: message.conversationId,
              traceId: message.id,
              rating: "negative",
              comment,
            },
            {
              onSuccess: () => {
                setFeedbackSubmitted(message.id, "negative");
              },
            },
          );
        }}
        onCancel={() => setLocalState("none")}
        isSubmitting={isPending}
      />
    );
  }

  // Optimistic submitted state (thumbs up just clicked, awaiting API)
  if (localState === "positive") {
    return <FeedbackSubmittedState />;
  }

  const handlePositive = () => {
    setLocalState("positive");
    submitFeedback(
      {
        messageId: message.id,
        conversationId: message.conversationId,
        traceId: message.id,
        rating: "positive",
      },
      {
        onSuccess: () => {
          setFeedbackSubmitted(message.id, "positive");
        },
      },
    );
  };

  const handleNegative = () => {
    setLocalState("negative");
  };

  return (
    <div className="flex items-center gap-1.5 px-1">
      <button
        onClick={handlePositive}
        disabled={isPending}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Good response"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handleNegative}
        disabled={isPending}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Bad response"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
