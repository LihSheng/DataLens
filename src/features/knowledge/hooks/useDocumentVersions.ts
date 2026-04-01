import { useQuery } from "@tanstack/react-query";
import { httpClient } from "../../../services/httpClient";
import type { DocumentVersion } from "../../../types";

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ["documents", documentId, "versions"],
    queryFn: () =>
      httpClient
        .get<DocumentVersion[]>(`/api/documents/${documentId}/versions`)
        .then((r) => r.data),
    enabled: !!documentId,
  });
}
