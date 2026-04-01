import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "../../../services/httpClient";
import { useUIStore } from "../../../store/uiStore";

export function useReindexDocument() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (documentId: string) =>
      httpClient.post(`/api/documents/${documentId}/reindex`, {}),
    onSuccess: (_, documentId) => {
      addToast("Re-indexing started", "success");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      // Also update the document in the cache to "processing"
      queryClient.setQueryData(["documents"], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return (old as { id: string }[]).map((d) =>
          d.id === documentId ? { ...d, status: "processing" } : d,
        );
      });
    },
    onError: (err: Error) => {
      addToast(`Re-index failed: ${err.message}`, "error");
    },
  });
}
