import { http, HttpResponse } from "msw";
import { getSettings, updateSettings, resetSettings } from "../data/settings";

export const settingsHandlers = [
  // GET /api/settings
  http.get("/api/settings", () => {
    return HttpResponse.json(getSettings());
  }),

  // POST /api/settings — update settings
  http.post("/api/settings", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown> | null;

    if (!body || typeof body !== "object") {
      return HttpResponse.json(
        { message: "Request body is required" },
        { status: 400 },
      );
    }

    // Basic validation
    const updates = body as Partial<Record<string, unknown>>;
    if (
      updates.topK !== undefined &&
      (typeof updates.topK !== "number" ||
        updates.topK < 1 ||
        updates.topK > 20)
    ) {
      return HttpResponse.json(
        { message: "topK must be a number between 1 and 20" },
        { status: 400 },
      );
    }
    if (
      updates.temperature !== undefined &&
      (typeof updates.temperature !== "number" ||
        updates.temperature < 0 ||
        updates.temperature > 2)
    ) {
      return HttpResponse.json(
        { message: "temperature must be between 0 and 2" },
        { status: 400 },
      );
    }
    if (
      updates.maxTokens !== undefined &&
      (typeof updates.maxTokens !== "number" || updates.maxTokens < 1)
    ) {
      return HttpResponse.json(
        { message: "maxTokens must be a positive number" },
        { status: 400 },
      );
    }

    return HttpResponse.json(updateSettings(updates));
  }),
];

// Exported for test reset
export { resetSettings };
