import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "../../../services/httpClient";
import { useUIStore } from "../../../store/uiStore";

export function useReindexDocument() {
  const queryClient = useQueryClient();
  const pushToast = useUIStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (documentId: string) =>
      httpClient.post(`/api/documents/${documentId}/reindex`, {}),
    onSuccess: (_, documentId) => {
      pushToast({ message: "Re-indexing started", type: "success" });
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
      pushToast({ message: `Re-index failed: ${err.message}`, type: "error" });
    },
  });
}
