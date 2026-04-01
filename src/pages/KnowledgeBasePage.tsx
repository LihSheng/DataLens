import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, FileText, RefreshCw, Search, Trash2 } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { FileUploader } from "../features/knowledge/components/FileUploader";
import { StatusBadge } from "../features/knowledge/components/StatusBadge";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { deleteDocument } from "../services/api/documents";
import { useUIStore } from "../store/uiStore";
import type { Document, DocumentStatus } from "../types";

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

function TableSkeleton() {
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
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </div>
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
              <td className="px-4 py-3 text-right">
                <div className="h-8 w-8 bg-muted rounded animate-pulse ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KnowledgeBasePage() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">(
    "all",
  );
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    doc: Document | null;
  }>({
    isOpen: false,
    doc: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

  const deleteMutation = useMutation<
    unknown,
    Error,
    string,
    Document[] | undefined
  >({
    mutationFn: (id: string) => deleteDocument(id),
    onMutate: (id) => {
      const previous = queryClient.getQueryData<Document[]>(["documents"]);
      queryClient.setQueryData<Document[]>(["documents"], (old) =>
        old ? old.filter((d) => d.id !== id) : [],
      );
      return previous;
    },
    onError: (_err, _id, previous) => {
      if (previous !== undefined) {
        queryClient.setQueryData<Document[]>(["documents"], previous);
      }
      addToast("Failed to delete document. Please try again.", "error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    setIsRefreshing(false);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  const handleDeleteClick = (doc: Document) => {
    setConfirmDelete({ isOpen: true, doc });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete.doc) {
      deleteMutation.mutate(confirmDelete.doc.id);
    }
    setConfirmDelete({ isOpen: false, doc: null });
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ isOpen: false, doc: null });
  };

  return (
    <div className="space-y-6">
      {/* File uploader */}
      <FileUploader />

      {/* Search + Filter + Refresh row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as DocumentStatus | "all")
          }
          className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
        >
          <option value="all">All statuses</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>

        {/* Refresh button */}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          }
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Document table */}
      {isLoading ? (
        <TableSkeleton />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No documents yet"
          description="Upload your first document to build your knowledge base."
        />
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No documents match your filters"
          description="Try adjusting your search query or status filter."
        />
      ) : (
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
              {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatBytes(doc.size)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(doc.uploadedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Delete document"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => handleDeleteClick(doc)}
                      disabled={deleteMutation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete document?"
        description={
          confirmDelete.doc
            ? `This will permanently remove "${confirmDelete.doc.name}" from the knowledge base.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
