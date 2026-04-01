import { useChatStore } from "../store";
import { TokenUsageBar } from "./TokenUsageBar";
import { ContextUsageSummary } from "./ContextUsageSummary";
import type { TokenUsage } from "../../../types";

export function SourcePanelFooter() {
  const { activeConversationId, messages } = useChatStore();

  const conversationMessages = activeConversationId
    ? (messages[activeConversationId] ?? [])
    : [];
  const lastAssistantMessage = [...conversationMessages]
    .reverse()
    .find((m) => m.role === "assistant" && m.tokenUsage);

  const tokenUsage: TokenUsage | undefined = lastAssistantMessage?.tokenUsage;

  if (!tokenUsage) return null;

  return (
    <div className="border-t px-3 py-3 space-y-2">
      <TokenUsageBar used={tokenUsage.used} available={tokenUsage.available} />
      <ContextUsageSummary tokenUsage={tokenUsage} />
    </div>
  );
}
