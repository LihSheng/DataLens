import { useState } from "react";
import { Lock } from "lucide-react";
import type { DocumentRecord, DocumentStatus } from "../../../types";
import { DocumentTypeIcon } from "./DocumentTypeIcon";
import { InfoBadge } from "./InfoBadge";
import { VersionBadge } from "./VersionBadge";
import { StatusBadge } from "./StatusBadge";
import { DocumentActionMenu } from "./DocumentActionMenu";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
import { DocumentDetailDrawer } from "./DocumentDetailDrawer";
import { ReindexBanner } from "./ReindexBanner";
import { useReindexDocument } from "../hooks/useReindexDocument";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

interface DocumentTableProps {
  documents: DocumentRecord[];
  isLoading?: boolean;
  showChunkingWarning?: boolean;
  onDismissChunkingWarning?: () => void;
  onDelete: (doc: DocumentRecord) => void;
  deleteMutationIsPending?: boolean;
}

export function DocumentTable({
  documents,
  isLoading,
  showChunkingWarning,
  onDismissChunkingWarning,
  onDelete,
  deleteMutationIsPending,
}: DocumentTableProps) {
  const [versionDrawerDocId, setVersionDrawerDocId] = useState<string | null>(
    null,
  );
  const [detailDrawerDoc, setDetailDrawerDoc] = useState<DocumentRecord | null>(
    null,
  );
  const reindexMutation = useReindexDocument();

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Size</th>
              <th className="px-4 py-3 text-left font-medium">Uploaded</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[0, 1, 2].map((i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-8 w-8 bg-muted rounded ml-auto animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      {showChunkingWarning && (
        <ReindexBanner onDismiss={onDismissChunkingWarning} />
      )}

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Size</th>
              <th className="px-4 py-3 text-left font-medium">Uploaded</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                {/* Name cell with icon + badges */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DocumentTypeIcon extension={doc.extension} />
                    <span className="truncate font-medium">{doc.name}</span>
                    {doc.version && doc.version > 1 && (
                      <VersionBadge version={doc.version} />
                    )}
                    {doc.ocrApplied && <InfoBadge label="OCR" />}
                    {doc.piiEntitiesFound &&
                      doc.piiEntitiesFound.length > 0 && (
                        <InfoBadge label="PII" variant="warning" />
                      )}
                    {doc.restricted && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </td>

                {/* Size */}
                <td className="px-4 py-3 text-muted-foreground">
                  {formatBytes(doc.size)}
                </td>

                {/* Uploaded */}
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(doc.uploadedAt)}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge
                    status={doc.status as DocumentStatus}
                    parseError={doc.parseError}
                    queuePosition={doc.queuePosition}
                  />
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <DocumentActionMenu
                    onDetails={() => setDetailDrawerDoc(doc)}
                    onVersionHistory={() => setVersionDrawerDocId(doc.id)}
                    onReindex={() => reindexMutation.mutate(doc.id)}
                    onDelete={() => onDelete(doc)}
                    isReindexing={reindexMutation.isPending}
                    disabled={deleteMutationIsPending}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <VersionHistoryDrawer
        documentId={versionDrawerDocId ?? ""}
        isOpen={versionDrawerDocId !== null}
        onClose={() => setVersionDrawerDocId(null)}
      />

      <DocumentDetailDrawer
        document={detailDrawerDoc}
        isOpen={detailDrawerDoc !== null}
        onClose={() => setDetailDrawerDoc(null)}
      />
    </>
  );
}
