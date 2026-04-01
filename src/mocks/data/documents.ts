import type { Document, DocumentRecord, DocumentAcl } from "../../types";

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc_1",
    name: "Product Requirements Q3.pdf",
    size: 1_240_000,
    mimeType: "application/pdf",
    status: "ready",
    uploadedAt: "2024-10-15T08:00:00Z",
    chunkCount: 142,
  },
  {
    id: "doc_2",
    name: "API Reference v2.docx",
    size: 890_000,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    status: "ready",
    uploadedAt: "2024-10-18T10:30:00Z",
    chunkCount: 87,
  },
  {
    id: "doc_3",
    name: "Architecture Overview.md",
    size: 45_000,
    mimeType: "text/markdown",
    status: "ready",
    uploadedAt: "2024-10-20T09:00:00Z",
    chunkCount: 22,
  },
  {
    id: "doc_4",
    name: "Deployment Guide.txt",
    size: 12_000,
    mimeType: "text/plain",
    status: "processing",
    uploadedAt: "2024-11-01T12:00:00Z",
  },
  {
    id: "doc_5",
    name: "Invalid Format.csv",
    size: 500_000,
    mimeType: "text/csv",
    status: "failed",
    uploadedAt: "2024-10-25T14:00:00Z",
  },
];

// Mirror of MOCK_DOCUMENTS with all DocumentRecord extra fields
export const MOCK_DOCUMENT_RECORDS: DocumentRecord[] = [
  {
    id: "doc_1",
    name: "Product Requirements Q3.pdf",
    size: 1_240_000,
    mimeType: "application/pdf",
    status: "ready",
    uploadedAt: "2024-10-15T08:00:00Z",
    extension: "pdf",
    ocrApplied: true,
    piiEntitiesFound: ["email", "phone"],
    version: 2,
    chunkCount: 142,
  },
  {
    id: "doc_2",
    name: "API Reference v2.docx",
    size: 890_000,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    status: "ready",
    uploadedAt: "2024-10-18T10:30:00Z",
    extension: "docx",
    version: 3,
    chunkCount: 87,
  },
  {
    id: "doc_3",
    name: "Architecture Overview.md",
    size: 45_000,
    mimeType: "text/markdown",
    status: "ready",
    uploadedAt: "2024-10-20T09:00:00Z",
    extension: "md",
    restricted: true,
    version: 1,
    chunkCount: 22,
  },
  {
    id: "doc_4",
    name: "Deployment Guide.txt",
    size: 12_000,
    mimeType: "text/plain",
    status: "processing",
    uploadedAt: "2024-11-01T12:00:00Z",
    extension: "txt",
    queuePosition: 2,
    version: 1,
  },
  {
    id: "doc_5",
    name: "Invalid Format.csv",
    size: 500_000,
    mimeType: "text/csv",
    status: "failed",
    uploadedAt: "2024-10-25T14:00:00Z",
    extension: "csv",
    parseError: "Unsupported delimiter pattern detected",
    version: 1,
  },
];

// In-memory store for mutations in tests — seed with full DocumentRecord fields
let documents: DocumentRecord[] = [...MOCK_DOCUMENT_RECORDS];

export const getDocuments = () => [...documents];

export const addDocument = (doc: Document) => {
  documents = [doc, ...documents];
  return doc;
};

export const removeDocument = (id: string) => {
  documents = documents.filter((d) => d.id !== id);
};

export const resetDocuments = () => {
  documents = [...MOCK_DOCUMENT_RECORDS];
};

// ─── Document ACL Store ───────────────────────────────────────────────────────

const DEFAULT_ACLS: DocumentAcl[] = [
  {
    documentId: "doc_1",
    accessMode: "all",
    allowedRoles: [],
    allowedUsers: [],
  },
  {
    documentId: "doc_2",
    accessMode: "roles",
    allowedRoles: ["admin", "analyst"],
    allowedUsers: [],
  },
  {
    documentId: "doc_3",
    accessMode: "users",
    allowedRoles: [],
    allowedUsers: ["user_1"],
  },
  {
    documentId: "doc_4",
    accessMode: "all",
    allowedRoles: [],
    allowedUsers: [],
  },
  {
    documentId: "doc_5",
    accessMode: "all",
    allowedRoles: [],
    allowedUsers: [],
  },
];

let acls: DocumentAcl[] = [...DEFAULT_ACLS];

export const getDocumentAcl = (documentId: string): DocumentAcl | undefined =>
  acls.find((a) => a.documentId === documentId);

export const setDocumentAcl = (
  documentId: string,
  updates: Partial<DocumentAcl>,
): DocumentAcl => {
  const idx = acls.findIndex((a) => a.documentId === documentId);
  const updated: DocumentAcl =
    idx !== -1
      ? { ...acls[idx], ...updates }
      : {
          documentId,
          accessMode: "all",
          allowedRoles: [],
          allowedUsers: [],
          ...updates,
        };

  if (idx !== -1) {
    acls = acls.map((a) => (a.documentId === documentId ? updated : a));
  } else {
    acls = [...acls, updated];
  }
  return updated;
};

export const resetAcls = () => {
  acls = [...DEFAULT_ACLS];
};
