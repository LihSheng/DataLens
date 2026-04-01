import { create } from "zustand";
import type { Document } from "../../types";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "processing" | "done" | "failed";
}

interface KnowledgeState {
  documents: Document[];
  uploadQueue: UploadItem[];

  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  addUploadItem: (item: UploadItem) => void;
  updateUploadItem: (id: string, updates: Partial<UploadItem>) => void;
  removeUploadItem: (id: string) => void;
}

export const useKnowledgeStore = create<KnowledgeState>()((set) => ({
  documents: [],
  uploadQueue: [],

  setDocuments: (documents) => set({ documents }),

  addDocument: (document) =>
    set((s) => ({ documents: [document, ...s.documents] })),

  updateDocument: (id, updates) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id ? { ...d, ...updates } : d,
      ),
    })),

  removeDocument: (id) =>
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
    })),

  addUploadItem: (item) =>
    set((s) => ({ uploadQueue: [...s.uploadQueue, item] })),

  updateUploadItem: (id, updates) =>
    set((s) => ({
      uploadQueue: s.uploadQueue.map((u) =>
        u.id === id ? { ...u, ...updates } : u,
      ),
    })),

  removeUploadItem: (id) =>
    set((s) => ({
      uploadQueue: s.uploadQueue.filter((u) => u.id !== id),
    })),
}));
