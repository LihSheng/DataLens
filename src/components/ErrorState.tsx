import type { LucideIcon } from "lucide-react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  icon: Icon = AlertCircle,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center ${className}`}
    >
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <Icon className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {message && (
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">{message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
