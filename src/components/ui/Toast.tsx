import { useEffect } from "react";
import { CheckCircle, XCircle, Info, X, AlertTriangle } from "lucide-react";
import { useUIStore } from "../../store/uiStore";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success:
    "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
  error:
    "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  warning:
    "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200",
};

const ICON_STYLES = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-amber-500",
};

export function Toast() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          durationMs={toast.durationMs}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  durationMs: number;
  onDismiss: (id: string) => void;
}

function ToastItem({
  id,
  message,
  type,
  durationMs,
  onDismiss,
}: ToastItemProps) {
  const Icon = ICONS[type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), durationMs);
    return () => clearTimeout(timer);
  }, [id, onDismiss, durationMs]);

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
        "pointer-events-auto animate-in slide-in-from-top fade-in duration-200",
        STYLES[type],
      ].join(" ")}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${ICON_STYLES[type]}`} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
