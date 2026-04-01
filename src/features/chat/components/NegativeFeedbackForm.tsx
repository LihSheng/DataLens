import { useState } from "react";
import type { Message } from "../../../types";

interface NegativeFeedbackFormProps {
  message: Message;
  onSubmit: (comment?: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const MAX_CHARS = 200;

export function NegativeFeedbackForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: NegativeFeedbackFormProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(comment.trim() || undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[280px] flex-col gap-2 rounded-lg border border-border bg-background p-3 shadow-sm"
    >
      <p className="text-xs font-medium text-foreground">
        What was wrong with this response?
      </p>
      <div className="relative">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Optional feedback..."
          className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
          disabled={isSubmitting}
        />
        <span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
          {comment.length}/{MAX_CHARS}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
