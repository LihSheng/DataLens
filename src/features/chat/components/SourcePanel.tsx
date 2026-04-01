import { FileText } from "lucide-react";
import { useChatStore } from "../store";
import { SourceCard } from "./SourceCard";
import type { Source } from "../../../types";

export function SourcePanelContent() {
  const { activeConversationId, messages } = useChatStore();

  // Get sources from the last assistant message in the active conversation
  const conversationMessages = activeConversationId
    ? (messages[activeConversationId] ?? [])
    : [];
  const lastAssistantMessage = [...conversationMessages]
    .reverse()
    .find((m) => m.role === "assistant" && m.sources && m.sources.length > 0);

  const sources: Source[] = lastAssistantMessage?.sources ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {sources.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground text-center px-4">
            No sources available for this response.
          </p>
        </div>
      ) : (
        sources.map((source, index) => (
          <SourceCard
            key={source.id ?? source.documentId ?? index}
            source={source}
            index={index}
          />
        ))
      )}
    </div>
  );
}

import { X } from "lucide-react";
import { useUIStore } from "../../../store/uiStore";

export function SourcePanel() {
  const { isSourcePanelOpen, toggleSourcePanel } = useUIStore();

  if (!isSourcePanelOpen) return null;

  return (
    <aside className="flex h-full w-72 flex-col border-l bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Sources
        </h2>
        <button
          onClick={toggleSourcePanel}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close source panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <SourcePanelContent />
    </aside>
  );
}
