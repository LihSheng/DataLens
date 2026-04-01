import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "../../../services/httpClient";
import type { DocumentAcl } from "../../../types";
import { useUIStore } from "../../../store/uiStore";

export function useDocumentAcl(documentId: string) {
  return useQuery({
    queryKey: ["documents", documentId, "acl"],
    queryFn: () =>
      httpClient
        .get<DocumentAcl>(`/api/documents/${documentId}/acl`)
        .then((r) => r.data),
    enabled: !!documentId,
  });
}

export function useUpdateDocumentAcl() {
  const queryClient = useQueryClient();
  const pushToast = useUIStore((s) => s.pushToast);

  return useMutation({
    mutationFn: ({
      documentId,
      acl,
    }: {
      documentId: string;
      acl: Partial<DocumentAcl>;
    }) => httpClient.put<DocumentAcl>(`/api/documents/${documentId}/acl`, acl),

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["documents", data.data.documentId, "acl"],
        data.data,
      );
      pushToast({ message: "Access control updated", type: "success" });
    },
    onError: (err: Error) => {
      pushToast({
        message: `Failed to update ACL: ${err.message}`,
        type: "error",
      });
    },
  });
}
