import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Progress } from "../../../components/ui/Progress";
import { Button } from "../../../components/ui/Button";

interface UploadProgressBarProps {
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "failed";
  onRetry?: () => void;
}

export function UploadProgressBar({
  fileName,
  progress,
  status,
  onRetry,
}: UploadProgressBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="truncate text-sm font-medium">{fileName}</span>
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
            {status === "done" ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" /> Done
              </span>
            ) : status === "failed" ? (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <XCircle className="h-3.5 w-3.5" /> Failed
              </span>
            ) : (
              `${Math.round(progress)}%`
            )}
          </span>
        </div>
        {status !== "done" && status !== "failed" ? (
          <Progress value={progress} />
        ) : null}
        {status === "failed" && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-3 w-3" />}
            onClick={onRetry}
            className="mt-1 h-6 px-2 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
