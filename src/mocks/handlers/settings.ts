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
    if (
      updates.hybridWeightDense !== undefined &&
      (typeof updates.hybridWeightDense !== "number" ||
        updates.hybridWeightDense < 0 ||
        updates.hybridWeightDense > 1)
    ) {
      return HttpResponse.json(
        { message: "hybridWeightDense must be between 0 and 1" },
        { status: 400 },
      );
    }
    if (
      updates.confidenceThreshold !== undefined &&
      (typeof updates.confidenceThreshold !== "number" ||
        updates.confidenceThreshold < 0 ||
        updates.confidenceThreshold > 1)
    ) {
      return HttpResponse.json(
        { message: "confidenceThreshold must be between 0 and 1" },
        { status: 400 },
      );
    }
    if (
      updates.memoryWindow !== undefined &&
      (typeof updates.memoryWindow !== "number" ||
        updates.memoryWindow < 1 ||
        updates.memoryWindow > 20 ||
        !Number.isInteger(updates.memoryWindow))
    ) {
      return HttpResponse.json(
        { message: "memoryWindow must be an integer between 1 and 20" },
        { status: 400 },
      );
    }
    if (
      updates.conversationRetentionDays !== undefined &&
      (typeof updates.conversationRetentionDays !== "number" ||
        updates.conversationRetentionDays < 1 ||
        updates.conversationRetentionDays > 365 ||
        !Number.isInteger(updates.conversationRetentionDays))
    ) {
      return HttpResponse.json(
        {
          message:
            "conversationRetentionDays must be an integer between 1 and 365",
        },
        { status: 400 },
      );
    }
    if (
      updates.chunkingStrategy !== undefined &&
      typeof updates.chunkingStrategy === "string" &&
      !["semantic", "recursive", "fixed"].includes(updates.chunkingStrategy)
    ) {
      return HttpResponse.json(
        {
          message:
            "chunkingStrategy must be one of 'semantic', 'recursive', or 'fixed'",
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(updateSettings(updates));
  }),
];

// Exported for test reset
export { resetSettings };
