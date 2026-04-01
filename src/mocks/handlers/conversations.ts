import { http, HttpResponse } from "msw";
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_SEARCH_RESULTS,
} from "../data/conversations";

// Shared mutable state for conversation CRUD — exported so chat.ts can also
// use this same store and mutations are visible to both sets of handlers.
export const conversations = [...MOCK_CONVERSATIONS];
export const messages: Record<string, (typeof MOCK_MESSAGES)[string]> =
  JSON.parse(JSON.stringify(MOCK_MESSAGES));

export { MOCK_CONVERSATIONS, MOCK_MESSAGES };

export const conversationHandlers = [
  // GET /api/conversations/search?q={query}
  http.get("/api/conversations/search", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";

    if (!q) return HttpResponse.json([]);

    const results = conversations
      .filter((c) => c.title.toLowerCase().includes(q))
      .map((c) => {
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

    // Pre-defined search results for specific queries
    if (q in MOCK_SEARCH_RESULTS) {
      return HttpResponse.json(MOCK_SEARCH_RESULTS[q]);
    }

    return HttpResponse.json(results);
  }),

  // GET /api/conversations/:id/export?format=md|pdf
  http.get("/api/conversations/:id/export", ({ params, request }) => {
    const { id } = params as { id: string };
    const url = new URL(request.url);
    const _format = url.searchParams.get("format") ?? "md";
    void _format; // pdf support future

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

    const filename = `${conv?.title ?? "conversation"}.md`;

    return new HttpResponse(md, {
      headers: {
        "Content-Type": "text/markdown;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
      token: `share_token_${id}`,
      url: `/share/share_token_${id}`,
    });
  }),

  // GET /api/share/:token
  http.get("/api/share/:token", ({ params }) => {
    const { token: _ } = params as { token: string };
    void _;
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
