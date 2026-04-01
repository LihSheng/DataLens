import { AlertTriangle, X } from "lucide-react";

interface ReindexBannerProps {
  onDismiss?: () => void;
}

export function ReindexBanner({ onDismiss }: ReindexBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 p-4">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-amber-800 dark:text-amber-200">
        Existing documents use a different strategy. Re-index to apply.
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded hover:opacity-70"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </button>
      )}
    </div>
  );
}
