import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { documentsApi } from "../../../services/api/documents";
import { useChatStore } from "../store";
import { FilterChipGroup } from "../../../components/FilterChipGroup";
import type { Document } from "../../../types";

export function SearchScopePicker() {
  const [expanded, setExpanded] = useState(false);
  const { activeFilters, setActiveFilters, clearActiveFilters } =
    useChatStore();
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.getDocuments,
  });

  const selectedIds = activeFilters.document_ids ?? [];

  const handleToggle = (docId: string) => {
    const newIds = selectedIds.includes(docId)
      ? selectedIds.filter((id) => id !== docId)
      : [...selectedIds, docId];
    if (newIds.length === 0) {
      clearActiveFilters();
    } else {
      setActiveFilters({ document_ids: newIds });
    }
  };

  const handleSelectAll = () => {
    clearActiveFilters();
  };

  const chips = selectedIds.map((id) => {
    const doc = documents.find((d: Document) => d.id === id);
    return { id, label: doc?.name ?? id };
  });

  const readyDocs = documents.filter((d: Document) => d.status === "ready");

  return (
    <div className="space-y-2">
      {/* Chips row — only shown when scope is narrowed */}
      {chips.length > 0 && (
        <FilterChipGroup chips={chips} onRemove={handleToggle} />
      )}

      {/* Toggle button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
      >
        <FileText className="h-3.5 w-3.5" />
        {chips.length > 0
          ? `${chips.length} document${chips.length > 1 ? "s" : ""} selected`
          : "All documents"}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expandable document list */}
      {expanded && (
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <button
            onClick={handleSelectAll}
            className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
              selectedIds.length === 0
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            All documents
          </button>

          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 rounded-md bg-muted animate-pulse"
                />
              ))}
            </>
          )}

          {!isLoading && readyDocs.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-1">
              No documents uploaded yet
            </p>
          )}

          {!isLoading &&
            readyDocs.map((doc: Document) => {
              const checked = selectedIds.includes(doc.id);
              return (
                <label
                  key={doc.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(doc.id)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs truncate text-foreground">
                    {doc.name}
                  </span>
                </label>
              );
            })}
        </div>
      )}
    </div>
  );
}
