import { http, HttpResponse } from "msw";
import type { DocumentVersion } from "../../types";
import {
  getDocuments,
  addDocument,
  removeDocument,
  resetDocuments,
} from "../data/documents";

export const documentHandlers = [
  // GET /api/documents
  http.get("/api/documents", () => {
    return HttpResponse.json(getDocuments());
  }),

  // POST /api/documents — upload a new document (simulated processing)
  http.post("/api/documents", async ({ request }) => {
    // Parse multipart form data (file upload via FormData)
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return HttpResponse.json(
        { message: "File is required" },
        { status: 400 },
      );
    }

    const doc = {
      id: `doc_${Date.now()}`,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      status: "processing" as const,
      uploadedAt: new Date().toISOString(),
    };

    addDocument(doc);

    // After a short delay, mark as ready
    setTimeout(() => {
      const docs = getDocuments();
      const idx = docs.findIndex((d) => d.id === doc.id);
      if (idx !== -1 && docs[idx].status === "processing") {
        docs[idx] = {
          ...docs[idx],
          status: "ready",
          chunkCount: Math.floor(Math.random() * 200) + 10,
        };
      }
    }, 3000);

    return HttpResponse.json(doc, { status: 201 });
  }),

  // DELETE /api/documents/:id
  http.delete("/api/documents/:id", ({ params }) => {
    const { id } = params as { id: string };
    const docs = getDocuments();
    if (!docs.find((d) => d.id === id)) {
      return HttpResponse.json(
        { message: "Document not found" },
        { status: 404 },
      );
    }
    removeDocument(id);
    return new Response(null, { status: 204 });
  }),

  // GET /api/documents/:id/versions
  http.get("/api/documents/:id/versions", ({ params }) => {
    const { id } = params as { id: string };
    const docs = getDocuments();
    if (!docs.find((d) => d.id === id)) {
      return HttpResponse.json(
        { message: "Document not found" },
        { status: 404 },
      );
    }
    const versionMap: Record<string, DocumentVersion[]> = {
      doc_1: [
        {
          id: "v1",
          version: 1,
          uploadedAt: "2024-09-01T08:00:00Z",
          status: "ready",
          isActive: false,
        },
        {
          id: "v2",
          version: 2,
          uploadedAt: "2024-10-15T08:00:00Z",
          status: "ready",
          isActive: true,
        },
      ],
      doc_2: [
        {
          id: "v1",
          version: 1,
          uploadedAt: "2024-08-01T10:00:00Z",
          status: "ready",
          isActive: false,
        },
        {
          id: "v2",
          version: 2,
          uploadedAt: "2024-09-15T10:00:00Z",
          status: "ready",
          isActive: false,
        },
        {
          id: "v3",
          version: 3,
          uploadedAt: "2024-10-18T10:30:00Z",
          status: "ready",
          isActive: true,
        },
      ],
      doc_3: [
        {
          id: "v1",
          version: 1,
          uploadedAt: "2024-10-20T09:00:00Z",
          status: "ready",
          isActive: true,
        },
      ],
      doc_4: [
        {
          id: "v1",
          version: 1,
          uploadedAt: "2024-11-01T12:00:00Z",
          status: "processing",
          isActive: true,
        },
      ],
      doc_5: [
        {
          id: "v1",
          version: 1,
          uploadedAt: "2024-10-25T14:00:00Z",
          status: "failed",
          isActive: true,
        },
      ],
    };
    return HttpResponse.json(versionMap[id] ?? []);
  }),

  // POST /api/documents/:id/reindex
  http.post("/api/documents/:id/reindex", ({ params }) => {
    const { id } = params as { id: string };
    const docs = getDocuments();
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { message: "Document not found" },
        { status: 404 },
      );
    }
    // Simulate: set to processing, then after 3s set back to ready with incremented version
    docs[idx] = { ...docs[idx], status: "processing" };
    setTimeout(() => {
      const updated = getDocuments();
      const i = updated.findIndex((d) => d.id === id);
      if (i !== -1) {
        updated[i] = {
          ...updated[i],
          status: "ready",
          // @ts-expect-error version may not exist on Document but we track it in our extended store
          version:
            ((updated[i] as unknown as { version?: number }).version ?? 1) + 1,
        };
      }
    }, 3000);
    return HttpResponse.json({ success: true, documentId: id });
  }),
];

// Exported for test reset
export { resetDocuments };
