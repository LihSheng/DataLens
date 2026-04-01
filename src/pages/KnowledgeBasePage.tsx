import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, RefreshCw, Search } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { FileUploader } from "../features/knowledge/components/FileUploader";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { DocumentTable } from "../features/knowledge/components/DocumentTable";
import { deleteDocument } from "../services/api/documents";
import { useUIStore } from "../store/uiStore";
import type { Document, DocumentStatus, DocumentRecord } from "../types";

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
  const [showChunkingWarning, setShowChunkingWarning] = useState(false);

  const { data: documents = [], isLoading } = useQuery<DocumentRecord[]>({
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

  const handleDeleteClick = (doc: DocumentRecord) => {
    setConfirmDelete({ isOpen: true, doc: doc as unknown as Document });
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
        <DocumentTable documents={[]} isLoading onDelete={() => {}} />
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
        <DocumentTable
          documents={filteredDocuments as DocumentRecord[]}
          isLoading={false}
          showChunkingWarning={showChunkingWarning}
          onDismissChunkingWarning={() => setShowChunkingWarning(false)}
          onDelete={handleDeleteClick}
          deleteMutationIsPending={deleteMutation.isPending}
        />
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
