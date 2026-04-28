import type { Conversation, Message } from "../../types";
import { httpClient } from "../../services/httpClient";
import { config } from "../../lib/config";

const base = config.apiBaseUrl;

export const chatApi = {
  /** Fetch all conversations */
  getConversations: async (): Promise<Conversation[]> => {
    const res = await httpClient.get<Conversation[]>("/api/conversations");
    return res.data;
  },

  /** Create a new conversation */
  createConversation: async (title?: string): Promise<Conversation> => {
    const res = await httpClient.post<Conversation>("/api/conversations", {
      title,
    });
    return res.data;
  },

  /** Rename a conversation */
  renameConversation: async (
    id: string,
    title: string,
  ): Promise<Conversation> => {
    const res = await httpClient.patch<Conversation>(
      `/api/conversations/${id}`,
      { title },
    );
    return res.data;
  },

  /** Delete a conversation */
  deleteConversation: async (id: string): Promise<void> => {
    await httpClient.delete(`/api/conversations/${id}`);
  },

  /** Auto-generate a conversation title from its messages */
  generateTitle: async (id: string): Promise<Conversation> => {
    const res = await httpClient.post<Conversation>("/api/title", {
      conversationId: id,
    });
    return res.data;
  },

  /** Fetch messages for a conversation */
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await httpClient.get<Message[]>(
      `/api/conversations/${conversationId}/messages`,
    );
    return res.data;
  },

  /**
   * Send a chat message and stream the response via SSE.
   * Returns a ReadableStream of parsed SSE data events.
   */
  sendMessage: (
    params: {
      conversationId?: string;
      message: string;
      filters?: import("../../types").ChatFilters;
    },
    accessToken: string | null,
    signal?: AbortSignal,
  ): ReadableStream => {
    const url = `${base}/api/chat`;
    const body = JSON.stringify(params);

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Use fetch with ReadableStream to consume SSE from POST /api/chat
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body,
          signal,
        })
          .then((response) => {
            if (!response.body) {
              controller.close();
              return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            const read = () => {
              reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    try {
                      const data = JSON.parse(line.slice(6));
                      controller.enqueue(
                        encoder.encode(JSON.stringify(data) + "\n"),
                      );
                    } catch {
                      // ignore parse errors on incomplete JSON
                    }
                  }
                }

                read();
              });
            };

            read();
          })
          .catch(() => {
            controller.close();
          });
      },
    });

    return stream;
  },
};
