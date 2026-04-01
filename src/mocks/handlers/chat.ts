import { http, HttpResponse } from "msw";
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_SOURCES,
} from "../data/conversations";

let conversations = [...MOCK_CONVERSATIONS];
const messages: Record<string, (typeof MOCK_MESSAGES)[string]> = JSON.parse(
  JSON.stringify(MOCK_MESSAGES),
);
let messageIdCounter = 100;
const feedbackStore: Array<{
  messageId: string;
  conversationId: string;
  traceId: string;
  rating: "positive" | "negative";
  comment?: string;
  createdAt: string;
}> = [];

export const chatHandlers = [
  // GET /api/conversations
  http.get("/api/conversations", () => {
    return HttpResponse.json(conversations);
  }),

  // POST /api/conversations — create a new conversation
  http.post("/api/conversations", async ({ request }) => {
    const body = (await request.json()) as { title?: string } | null;
    const newConversation = {
      id: `conv_${Date.now()}`,
      title: body?.title ?? "New conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversations = [newConversation, ...conversations];
    return HttpResponse.json(newConversation, { status: 201 });
  }),

  // PATCH /api/conversations/:id — rename a conversation
  http.patch("/api/conversations/:id", async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { title?: string } | null;
    const idx = conversations.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { message: "Conversation not found" },
        { status: 404 },
      );
    }
    if (!body?.title) {
      return HttpResponse.json(
        { message: "Title is required" },
        { status: 400 },
      );
    }
    conversations[idx] = {
      ...conversations[idx],
      title: body.title,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(conversations[idx]);
  }),

  // DELETE /api/conversations/:id — delete a conversation
  http.delete("/api/conversations/:id", ({ params }) => {
    const { id } = params as { id: string };
    const idx = conversations.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { message: "Conversation not found" },
        { status: 404 },
      );
    }
    conversations = conversations.filter((c) => c.id !== id);
    delete messages[id];
    return new Response(null, { status: 204 });
  }),

  // GET /api/conversations/:id/messages
  http.get("/api/conversations/:id/messages", ({ params }) => {
    const { id } = params as { id: string };
    return HttpResponse.json(messages[id] ?? []);
  }),

  // POST /api/chat — send a message and stream back a response
  http.post("/api/chat", async ({ request }) => {
    const body = (await request.json()) as {
      conversationId?: string;
      message?: string;
    } | null;

    if (!body?.message) {
      return HttpResponse.json(
        { message: "Message is required" },
        { status: 400 },
      );
    }

    const conversationId = body.conversationId ?? "conv_new";
    const userMessageId = `msg_${++messageIdCounter}`;
    const assistantMessageId = `msg_${++messageIdCounter}`;

    // Append user message
    if (!messages[conversationId]) {
      messages[conversationId] = [];
    }
    messages[conversationId] = [
      ...messages[conversationId],
      {
        id: userMessageId,
        conversationId,
        role: "user" as const,
        content: body.message,
        createdAt: new Date().toISOString(),
      },
    ];

    // Return streamed response as SSE
    const fullResponse =
      "Based on the retrieved context [1][2], the system processes your query through the RAG pipeline. The document chunks most relevant to your question are retrieved using semantic similarity search, and the LLM generates a response grounded in those chunks.";

    const suggestedFollowups = [
      "How does semantic similarity search work?",
      "What chunking strategies are available?",
      "Can I configure the reranking model?",
    ];

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let index = 0;

        const push = () => {
          if (index >= fullResponse.length) {
            // Send sources + suggested follow-ups + trust signals as final event
            const finalEvent = `data: ${JSON.stringify({
              sources: MOCK_SOURCES.slice(0, 2).map((s, i) => ({
                ...s,
                rerankScore: i === 0 ? 0.87 : 0.72,
              })),
              suggestedFollowups,
              confidence: "high",
              grounding: { fully_grounded: true, unsupported_count: 0 },
              latencyMs: 1240,
              tokenUsage: {
                used: 1842,
                available: 3000,
                chunksIncluded: 3,
                chunksAvailable: 5,
              },
            })}\n\n`;
            controller.enqueue(encoder.encode(finalEvent));
            controller.close();
            return;
          }

          const chunk = fullResponse.slice(index, index + 8);
          index += 8;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`),
          );

          setTimeout(push, 30);
        };

        // Send the assistant message start
        const startEvent = `data: ${JSON.stringify({
          id: assistantMessageId,
          conversationId,
          role: "assistant",
          createdAt: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(startEvent));
        setTimeout(push, 50);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }),

  // POST /api/feedback
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

  // GET /api/conversations/search?q={query}
  http.get("/api/conversations/search", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    if (!q) return HttpResponse.json([]);

    const results = conversations
      .filter((c) => c.title.toLowerCase().includes(q))
      .map((c) => {
        // Build a snippet from the first user message if available
        const msgs = messages[c.id];
        const firstUser = msgs?.find((m) => m.role === "user");
        return {
          ...c,
          snippet: firstUser
            ? firstUser.content.slice(0, 120) +
              (firstUser.content.length > 120 ? "…" : "")
            : undefined,
        };
      });

    return HttpResponse.json(results);
  }),

  // GET /api/conversations/:id/export?format=md|pdf
  http.get("/api/conversations/:id/export", ({ params, request }) => {
    const { id } = params as { id: string };
    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "md";

    const conv = conversations.find((c) => c.id === id);
    const convMessages = messages[id] ?? [];

    const md = [
      `# ${conv?.title ?? "Conversation"}`,
      "",
      ...convMessages.map((m) => {
        const role = m.role === "user" ? "**You**" : "**Assistant**";
        return `${role}:\n\n${m.content}`;
      }),
    ].join("\n\n");

    if (format === "md") {
      return new HttpResponse(md, {
        headers: {
          "Content-Type": "text/markdown;charset=utf-8",
          "Content-Disposition": `attachment; filename="conversation.md"`,
        },
      });
    }

    // PDF falls back to markdown (no actual PDF generation in mock)
    return new HttpResponse(md, {
      headers: {
        "Content-Type": "text/markdown;charset=utf-8",
        "Content-Disposition": `attachment; filename="conversation.md"`,
      },
    });
  }),

  // POST /api/conversations/:id/share
  http.post("/api/conversations/:id/share", ({ params }) => {
    const { id } = params as { id: string };
    const conv = conversations.find((c) => c.id === id);
    if (!conv) {
      return HttpResponse.json(
        { message: "Conversation not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      token: "mock_token_123",
      url: `/share/mock_token_123`,
    });
  }),

  // GET /api/share/:token
  http.get("/api/share/:token", ({ params }) => {
    const { token: _ } = params as { token: string };
    void _; // token not used in mock — any token returns the same shared conversation
    // Return the first conversation as the shared one for the mock token
    const conv = conversations[0];
    const convMessages = messages[conv.id] ?? [];
    return HttpResponse.json({
      id: conv.id,
      title: conv.title,
      messages: convMessages,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    });
  }),
];

export { conversations, messages };
