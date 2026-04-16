import { useState, useEffect, useRef } from "react";
import { Plus, MessageSquare, RefreshCw } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { ConversationSearchInput } from "./ConversationSearchInput";
import { ConversationSearchResults } from "./ConversationSearchResults";
import { EmptyState } from "../../../components/EmptyState";
import { Loader } from "../../../components/Loader";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useConversations } from "../hooks/useConversations";
import { useConversationSearch } from "../hooks/useConversationSearch";
import { useChatStore } from "../store";
import type { Conversation } from "../../../types";

function ConversationListSkeleton() {
  return (
    <div className="space-y-0.5 p-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 animate-pulse"
        >
          <div className="h-4 w-4 bg-muted rounded shrink-0" />
          <div
            className="flex-1 h-4 bg-muted rounded"
            style={{ width: `${60 + (i % 3) * 15}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function ConversationList() {
  const {
    data: conversations,
    isLoading,
    isError,
    refetch,
    createConversation,
    isCreating,
    renameConversation,
    isRenaming,
    deleteConversation,
    isDeleting,
  } = useConversations();
  const { activeConversationId, setActiveConversation } = useChatStore();

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    conv: Conversation | null;
  }>({
    isOpen: false,
    conv: null,
  });

  // Search state with debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  const {
    results: searchResults,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useConversationSearch(debouncedQuery);

  const isSearching = debouncedQuery.trim().length > 0;

  const handleNewChat = () => {
    createConversation(undefined);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
  };

  const handleDeleteClick = (id: string) => {
    const conv = conversations?.find((c) => c.id === id) ?? null;
    setConfirmDelete({ isOpen: true, conv });
  };

  const handleRename = (id: string, title: string) => {
    renameConversation({ id, title });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete.conv) {
      deleteConversation(confirmDelete.conv.id);
    }
    setConfirmDelete({ isOpen: false, conv: null });
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ isOpen: false, conv: null });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-sm font-semibold">Conversations</h2>
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          aria-label="New chat"
          title="New chat"
        >
          {isCreating ? (
            <Loader variant="spinner" className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Search input */}
      <ConversationSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        isLoading={isSearchLoading}
      />

      {/* Search results (shown when searching) */}
      {isSearching && (
        <div className="flex-1 overflow-y-auto border-b">
          <ConversationSearchResults
            results={searchResults}
            isLoading={isSearchLoading}
            isError={isSearchError}
            query={debouncedQuery}
          />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <ConversationListSkeleton />}

        {isError && (
          <div className="p-4">
            <EmptyState
              icon={MessageSquare}
              title="Failed to load"
              description="Could not load conversations."
              action={
                <button
                  onClick={() => refetch()}
                  className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              }
            />
          </div>
        )}

        {!isLoading &&
          !isError &&
          conversations &&
          conversations.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No conversations yet.</p>
              <button
                onClick={handleNewChat}
                className="mt-2 text-primary hover:underline"
              >
                Start a new chat
              </button>
            </div>
          )}

        {conversations && conversations.length > 0 && (
          <div className="p-2 space-y-0.5">
            {conversations.map((conv: Conversation) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => handleSelectConversation(conv.id)}
                onRename={handleRename}
                onDelete={handleDeleteClick}
                isRenaming={isRenaming}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete conversation?"
        description={
          confirmDelete.conv
            ? `This will permanently delete "${confirmDelete.conv.title}" and all its messages.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
