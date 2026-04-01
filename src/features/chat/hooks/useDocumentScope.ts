import { useMemo } from "react";
import { useChatStore } from "../store";
import type { Document } from "../../../types";

export function useDocumentScope(documents: Document[]) {
  const activeFilters = useChatStore((s) => s.activeFilters);
  const selectedIds = activeFilters.document_ids ?? [];

  const scopeLabel = useMemo(() => {
    if (selectedIds.length === 0) return "All documents";
    if (selectedIds.length === 1) {
      const doc = documents.find((d) => d.id === selectedIds[0]);
      return doc?.name ?? "1 document";
    }
    return `${selectedIds.length} documents`;
  }, [selectedIds, documents]);

  return {
    selectedIds,
    scopeLabel,
    isScoped: selectedIds.length > 0,
  };
}
