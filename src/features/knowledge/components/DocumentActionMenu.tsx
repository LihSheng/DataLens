import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

interface DocumentActionMenuProps {
  onVersionHistory: () => void;
  onReindex: () => void;
  onDelete: () => void;
  isReindexing?: boolean;
  disabled?: boolean;
}

export function DocumentActionMenu({
  onVersionHistory,
  onReindex,
  onDelete,
  isReindexing,
  disabled,
}: DocumentActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-right">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        aria-label="Document actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-md border bg-popover shadow-md overflow-hidden">
          <button
            onClick={() => {
              setOpen(false);
              onVersionHistory();
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            Version History
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onReindex();
            }}
            disabled={isReindexing}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isReindexing ? "Re-indexing…" : "Re-index"}
          </button>
          <div className="border-t my-1" />
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
