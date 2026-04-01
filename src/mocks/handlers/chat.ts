import { http, HttpResponse } from "msw";
import { MOCK_SOURCES } from "../data/conversations";
// Shared mutable state — both files mutate the same arrays exported from
// conversations.ts so all handlers see the same data at runtime.
import { conversations, messages } from "./conversations";

// Allow chat.ts to add new messages to the shared messages store
let messageIdCounter = 100;

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
    // Mutate the shared exported array
    conversations.push(newConversation);
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
    conversations.splice(idx, 1);
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

    // Append user message to shared store
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
];

export { conversations, messages };
