import { httpClient } from "../../services/httpClient";
import { config } from "../../lib/config";
import { useAuthStore } from "../../features/auth/store";
import type { Document, DocumentAcl } from "../../types";

function toApiUrl(path: string): string {
  const base = config.apiBaseUrl?.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

export const documentsApi = {
  getDocuments: async (): Promise<Document[]> => {
    const res = await httpClient.get<Document[]>("/api/documents");
    return res.data;
  },

  getDocumentAcl: async (documentId: string): Promise<DocumentAcl> => {
    const res = await httpClient.get<DocumentAcl>(
      `/api/documents/${documentId}/acl`,
    );
    return res.data;
  },

  updateDocumentAcl: async (
    documentId: string,
    acl: Partial<DocumentAcl>,
  ): Promise<DocumentAcl> => {
    const res = await httpClient.put<DocumentAcl>(
      `/api/documents/${documentId}/acl`,
      acl,
    );
    return res.data;
  },
};

export function uploadDocument(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Document> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", toApiUrl("/api/documents"));
    const token = useAuthStore.getState().accessToken;
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const doc = JSON.parse(xhr.responseText) as Document;
          resolve(doc);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message ?? "Upload failed"));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

export function deleteDocument(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", toApiUrl(`/api/documents/${id}`));
    const token = useAuthStore.getState().accessToken;
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message ?? "Delete failed"));
        } catch {
          reject(new Error(`Delete failed: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send();
  });
}
