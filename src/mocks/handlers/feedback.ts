import { http, HttpResponse } from "msw";
import { MOCK_FEEDBACK_STATS } from "../data/observability";

const feedbackStore: Array<{
  messageId: string;
  conversationId: string;
  traceId: string;
  rating: "positive" | "negative";
  comment?: string;
  createdAt: string;
}> = [];

export const feedbackHandlers = [
  // POST /api/feedback — store feedback
  http.post("/api/feedback", async ({ request }) => {
    const body = (await request.json()) as {
      messageId: string;
      conversationId: string;
      traceId: string;
      rating: "positive" | "negative";
      comment?: string;
    };

    if (
      !body.messageId ||
      !body.conversationId ||
      !body.traceId ||
      !body.rating
    ) {
      return HttpResponse.json(
        {
          message:
            "messageId, conversationId, traceId, and rating are required",
        },
        { status: 400 },
      );
    }

    if (body.rating !== "positive" && body.rating !== "negative") {
      return HttpResponse.json(
        { message: "rating must be 'positive' or 'negative'" },
        { status: 400 },
      );
    }

    const feedback = {
      messageId: body.messageId,
      conversationId: body.conversationId,
      traceId: body.traceId,
      rating: body.rating,
      comment: body.comment,
      createdAt: new Date().toISOString(),
    };

    feedbackStore.push(feedback);

    return HttpResponse.json(feedback, { status: 201 });
  }),

  // GET /api/feedback/stats — return aggregated feedback statistics
  http.get("/api/feedback/stats", () => {
    const positive = MOCK_FEEDBACK_STATS.positive;
    const negative = MOCK_FEEDBACK_STATS.negative;
    const total = positive + negative + feedbackStore.length;
    const positiveFromStore = feedbackStore.filter(
      (f) => f.rating === "positive",
    ).length;
    const negativeFromStore = feedbackStore.filter(
      (f) => f.rating === "negative",
    ).length;

    return HttpResponse.json({
      positive: positive + positiveFromStore,
      negative: negative + negativeFromStore,
      total: total,
    });
  }),
];

export { feedbackStore };
