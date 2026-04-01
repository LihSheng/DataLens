import { X, Lock, FileText } from "lucide-react";
import type { DocumentRecord } from "../../../types";
import { DocumentAccessControlPanel } from "../../governance/components/DocumentAccessControlPanel";
import { useAuthStore } from "../../auth/store";
import { formatBytes } from "./utils";

interface DocumentDetailDrawerProps {
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function DocumentDetailDrawer({
  document,
  isOpen,
  onClose,
}: DocumentDetailDrawerProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  if (!isOpen || !document) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-96 bg-card border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h2 className="text-sm font-semibold truncate">{document.name}</h2>
            {document.restricted && (
              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Document metadata */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{formatBytes(document.size)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">{document.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Uploaded</dt>
                <dd className="font-medium text-xs">
                  {formatDate(document.uploadedAt)}
                </dd>
              </div>
              {document.extension && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium uppercase">
                    {document.extension}
                  </dd>
                </div>
              )}
              {document.version && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Version</dt>
                  <dd className="font-medium">v{document.version}</dd>
                </div>
              )}
              {document.chunkCount !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Chunks</dt>
                  <dd className="font-medium">{document.chunkCount}</dd>
                </div>
              )}
              {document.ocrApplied && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">OCR</dt>
                  <dd className="font-medium text-emerald-600">Applied</dd>
                </div>
              )}
              {document.piiEntitiesFound &&
                document.piiEntitiesFound.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">PII entities</dt>
                    <dd className="font-medium text-amber-600">
                      {document.piiEntitiesFound.join(", ")}
                    </dd>
                  </div>
                )}
              {document.parseError && (
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Parse error</dt>
                  <dd className="text-xs text-red-500">
                    {document.parseError}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Access Control — admin only */}
          {isAdmin && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Access Control
              </h3>
              <DocumentAccessControlPanel documentId={document.id} />
            </section>
          )}

          {!isAdmin && document.restricted && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  This document has restricted access. Contact your admin to
                  request access.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
