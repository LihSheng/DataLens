import { useState, useCallback } from "react";
import { MoreVertical } from "lucide-react";
import {
  useFloating,
  flip,
  shift,
  offset,
  FloatingPortal,
  useClick,
  useDismiss,
  useInteractions,
} from "@floating-ui/react";

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

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [
      offset(6),
      flip({
        fallbackPlacements: ["left-start", "top-start"],
      }),
      shift(),
    ],
  });

  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context, {
    outsidePress: true,
  });
  const interactions = useInteractions([click, dismiss]);

  const referenceRef = useCallback(
    (node: HTMLElement | null) => {
      refs.setReference(node);
    },
    [refs],
  );

  const floatingRef = useCallback(
    (node: HTMLElement | null) => {
      refs.setFloating(node);
    },
    [refs],
  );

  return (
    <div ref={referenceRef} className="relative inline-block text-right">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        aria-label="Document actions"
        aria-expanded={open}
        {...interactions.getReferenceProps()}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <FloatingPortal>
        {open && (
          <div
            ref={floatingRef}
            style={floatingStyles}
            className="z-[9999] w-44 rounded-md border bg-popover shadow-md overflow-hidden"
            {...interactions.getFloatingProps()}
          >
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
      </FloatingPortal>
    </div>
  );
}
