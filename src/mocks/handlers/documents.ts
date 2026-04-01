import { http, HttpResponse } from "msw";
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
];

// Exported for test reset
export { resetDocuments };
