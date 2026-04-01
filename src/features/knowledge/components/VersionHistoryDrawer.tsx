import { X, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useDocumentVersions } from "../hooks/useDocumentVersions";
import type { DocumentVersion } from "../../../types";

interface VersionHistoryDrawerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

function VersionRow({ version }: { version: DocumentVersion }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5">
        {version.status === "ready" && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
        {version.status === "processing" && (
          <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
        )}
        {version.status === "failed" && (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Version {version.version}</span>
          {version.isActive && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-medium">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(version.uploadedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <span className="text-xs text-muted-foreground capitalize">
        {version.status}
      </span>
    </div>
  );
}

export function VersionHistoryDrawer({
  documentId,
  isOpen,
  onClose,
}: VersionHistoryDrawerProps) {
  const { data: versions = [], isLoading } = useDocumentVersions(documentId);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-80 bg-card border-l shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-sm font-semibold">Version History</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && versions.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No versions found.
            </p>
          )}
          {!isLoading &&
            versions.map((v) => <VersionRow key={v.id} version={v} />)}
        </div>
      </div>
    </>
  );
}
