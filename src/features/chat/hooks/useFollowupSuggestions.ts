import { useMemo } from "react";
import { useChatStore } from "../store";
import type { Message } from "../../../types";

/**
 * Returns suggested follow-up questions for a given assistant message,
 * together with visibility state so the UI knows whether to render them.
 */
export function useFollowupSuggestions(messageId: string) {
  const { visibleFollowupMessageId } = useChatStore();

  const isVisible = useMemo(
    () => visibleFollowupMessageId === messageId,
    [visibleFollowupMessageId, messageId],
  );

  return { isVisible };
}

/**
 * Derives suggested follow-ups from a message object.
 * Returns an empty array if the message is a user message or has no suggestions.
 */
export function getFollowupsFromMessage(message: Message): string[] {
  if (message.role !== "assistant") return [];
  return message.suggestedFollowups ?? [];
}
