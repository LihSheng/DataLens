import { useState, useRef, useCallback } from "react";
import { MessageSquare, Pencil, Check, X } from "lucide-react";
import type { Conversation } from "../../../types";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isRenaming: boolean;
  isDeleting: boolean;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onRename,
  onDelete,
  isRenaming,
  isDeleting,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(conversation.title);
      requestAnimationFrame(() => inputRef.current?.select());
    },
    [conversation.title],
  );

  const confirmRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, conversation.id, conversation.title, onRename]);

  const cancelRename = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(false);
      setEditValue(conversation.title);
    },
    [conversation.title],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmRename();
      } else if (e.key === "Escape") {
        e.stopPropagation();
        setIsEditing(false);
        setEditValue(conversation.title);
      }
    },
    [confirmRename, conversation.title],
  );

  return (
    <div
      className={`group relative flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <button
        onClick={onClick}
        aria-label={conversation.title}
        className="flex flex-1 items-center gap-2 text-left min-w-0"
        disabled={isEditing || isRenaming || isDeleting}
      >
        <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={confirmRename}
            className="flex-1 min-w-0 bg-transparent text-sm font-medium focus:outline-none rounded px-1 -mx-1 border border-primary-foreground/40 bg-primary-foreground/10"
            onClick={(e) => e.stopPropagation()}
            disabled={isRenaming}
          />
        ) : (
          <span className="truncate font-medium">{conversation.title}</span>
        )}
      </button>

      {/* Action buttons — visible on hover/focus within the item */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={startEditing}
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-primary-foreground/20 transition-colors"
            aria-label={`Rename "${conversation.title}"`}
            title="Rename"
            disabled={isRenaming || isDeleting}
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-destructive/20 hover:text-destructive transition-colors"
            aria-label={`Delete "${conversation.title}"`}
            title="Delete"
            disabled={isRenaming || isDeleting}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Editing confirmation buttons */}
      {isEditing && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmRename();
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
            aria-label="Confirm rename"
            disabled={isRenaming}
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={cancelRename}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
            aria-label="Cancel rename"
            disabled={isRenaming}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
