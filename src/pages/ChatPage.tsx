import { useEffect } from "react";
import { ConversationList } from "../features/chat/components/ConversationList";
import { ChatWindow } from "../features/chat/components/ChatWindow";
import {
  SourcePanel,
  SourcePanelContent,
} from "../features/chat/components/SourcePanel";
import { useChatStore } from "../features/chat/store";
import { useConversations } from "../features/chat/hooks/useConversations";
import { useUIStore } from "../store/uiStore";
import { X, PanelRight } from "lucide-react";

export function ChatPage() {
  const { activeConversationId } = useChatStore();
  const { data: conversations } = useConversations();
  const {
    isConversationsDrawerOpen,
    toggleConversationsDrawer,
    sourcePanel,
    openSourcePanel,
    closeSourcePanel,
  } = useUIStore();

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!activeConversationId && conversations && conversations.length > 0) {
      useChatStore.getState().setActiveConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-xl border bg-card overflow-hidden">
      {/* Mobile: conversation list as slide-over drawer */}
      {isConversationsDrawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={toggleConversationsDrawer}
          />
          <div className="relative z-50 w-72 shrink-0 border-r bg-card flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-sm font-semibold">Conversations</h2>
              <button
                onClick={toggleConversationsDrawer}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close conversations"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList />
            </div>
          </div>
        </div>
      )}

      {/* Desktop: conversation list always visible at lg+ */}
      <div className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r bg-card overflow-hidden rounded-l-xl">
        <ConversationList />
      </div>

      {/* Center: Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow conversationId={activeConversationId} />
      </div>

      {/* Source panel — desktop side panel, mobile drawer */}
      {sourcePanel.isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={closeSourcePanel}
          />
          <div className="relative z-50 ml-auto h-full w-4/5 max-w-sm border-l bg-card shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-sm font-semibold">Sources</h2>
              <button
                onClick={closeSourcePanel}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close sources panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SourcePanelContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Source panel as fixed sidebar (SourcePanel handles its own visibility) */}
      <div className="hidden lg:flex">
        <SourcePanel />
      </div>

      {/* Mobile: Source panel toggle button */}
      <button
        onClick={() =>
          sourcePanel.isOpen ? closeSourcePanel() : openSourcePanel()
        }
        className="fixed bottom-24 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="Toggle sources panel"
      >
        <PanelRight className="h-5 w-5" />
      </button>
    </div>
  );
}
