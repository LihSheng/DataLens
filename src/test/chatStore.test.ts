import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../../features/chat/store";
import type { Message, Conversation } from "../../types";

const MOCK_CONVERSATION: Conversation = {
  id: "conv_test",
  title: "Test conversation",
  createdAt: "2024-11-01T09:00:00Z",
  updatedAt: "2024-11-01T09:00:00Z",
};

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: "msg_1",
  conversationId: "conv_test",
  role: "user",
  content: "Hello world",
  createdAt: "2024-11-01T09:00:00Z",
  ...overrides,
});

beforeEach(() => {
  useChatStore.setState({
    conversations: [],
    activeConversationId: null,
    messagesByConversationId: {},
    streamState: null,
    activeFilters: {},
    draftMessage: "",
    visibleFollowupMessageId: null,
    submittedFeedback: {},
  });
});

describe("chatStore", () => {
  describe("conversations", () => {
    it("setConversations replaces the entire list", () => {
      const conversations = [MOCK_CONVERSATION];
      useChatStore.getState().setConversations(conversations);
      expect(useChatStore.getState().conversations).toEqual(conversations);
    });

    it("addConversation prepends to the list", () => {
      useChatStore.setState({ conversations: [MOCK_CONVERSATION] });
      const second: Conversation = {
        id: "conv_2",
        title: "Second",
        createdAt: "2024-11-01T10:00:00Z",
        updatedAt: "2024-11-01T10:00:00Z",
      };
      useChatStore.getState().addConversation(second);
      expect(useChatStore.getState().conversations).toEqual([
        second,
        MOCK_CONVERSATION,
      ]);
    });

    it("setActiveConversation sets activeConversationId", () => {
      useChatStore.getState().setActiveConversation("conv_1");
      expect(useChatStore.getState().activeConversationId).toBe("conv_1");
    });

    it("setActiveConversationId is an alias for setActiveConversation", () => {
      useChatStore.getState().setActiveConversationId("conv_alias");
      expect(useChatStore.getState().activeConversationId).toBe("conv_alias");
    });
  });

  describe("messages", () => {
    it("setMessages replaces messages for a conversation", () => {
      const messages = [
        makeMessage({ id: "msg_1", role: "user" }),
        makeMessage({ id: "msg_2", role: "assistant" }),
      ];
      useChatStore.getState().setMessages("conv_test", messages);
      expect(
        useChatStore.getState().messagesByConversationId["conv_test"],
      ).toEqual(messages);
    });

    it("appendMessage adds to existing messages", () => {
      useChatStore
        .getState()
        .setMessages("conv_test", [makeMessage({ id: "msg_1" })]);
      const newMsg = makeMessage({ id: "msg_2" });
      useChatStore.getState().appendMessage("conv_test", newMsg);
      const msgs =
        useChatStore.getState().messagesByConversationId["conv_test"];
      expect(msgs).toHaveLength(2);
      expect(msgs![1]).toEqual(newMsg);
    });

    it("addMessage is identical to appendMessage (both append)", () => {
      useChatStore
        .getState()
        .setMessages("conv_test", [makeMessage({ id: "msg_1" })]);
      const newMsg = makeMessage({ id: "msg_2" });
      useChatStore.getState().addMessage("conv_test", newMsg);
      expect(
        useChatStore.getState().messagesByConversationId["conv_test"],
      ).toHaveLength(2);
    });

    it("addOptimisticUserMessage creates a message with optimistic id and returns it", () => {
      const msg = useChatStore
        .getState()
        .addOptimisticUserMessage("conv_opt", "Hello");
      expect(msg.id).toMatch(/^optimistic_\d+$/);
      expect(msg.content).toBe("Hello");
      expect(msg.role).toBe("user");
      expect(
        useChatStore.getState().messagesByConversationId["conv_opt"],
      ).toContainEqual(msg);
    });

    it("clearMessages removes all messages for a conversation", () => {
      useChatStore.getState().setMessages("conv_test", [makeMessage()]);
      useChatStore.getState().clearMessages("conv_test");
      expect(
        useChatStore.getState().messagesByConversationId["conv_test"],
      ).toBeUndefined();
    });
  });

  describe("streaming", () => {
    it("startStream initialises streamState", () => {
      useChatStore.getState().startStream("conv_stream", "msg_stream");
      const state = useChatStore.getState().streamState;
      expect(state).toEqual({
        conversationId: "conv_stream",
        messageId: "msg_stream",
        buffer: "",
        status: "streaming",
      });
    });

    it("appendStreamChunk appends text to buffer", () => {
      useChatStore.getState().startStream("conv_stream", "msg_stream");
      useChatStore.getState().appendStreamChunk("Hello ");
      useChatStore.getState().appendStreamChunk("world");
      expect(useChatStore.getState().streamState?.buffer).toBe("Hello world");
    });

    it("appendStreamChunk is a no-op when streamState is null", () => {
      useChatStore.getState().appendStreamChunk("Hello");
      expect(useChatStore.getState().streamState).toBeNull();
    });

    it("finaliseStream updates the target message and clears streamState", () => {
      const msg = makeMessage({
        id: "msg_assistant",
        role: "assistant",
        content: "",
      });
      useChatStore.setState({
        messagesByConversationId: {
          conv_stream: [makeMessage({ id: "msg_user", role: "user" }), msg],
        },
        streamState: {
          conversationId: "conv_stream",
          messageId: "msg_assistant",
          buffer: "Final answer",
          status: "streaming",
        },
      });

      useChatStore
        .getState()
        .finaliseStream({ confidence: "high", latencyMs: 500 });

      const updatedMsg = useChatStore
        .getState()
        .messagesByConversationId[
          "conv_stream"
        ]!.find((m) => m.id === "msg_assistant");
      expect(updatedMsg!.content).toBe("Final answer");
      expect(updatedMsg!.status).toBe("done");
      expect(updatedMsg!.confidence).toBe("high");
      expect(updatedMsg!.latencyMs).toBe(500);
      expect(useChatStore.getState().streamState).toBeNull();
    });

    it("finaliseStream with no payload just updates status to done", () => {
      const msg = makeMessage({
        id: "msg_done",
        role: "assistant",
        content: "",
      });
      useChatStore.setState({
        messagesByConversationId: { conv_done: [msg] },
        streamState: {
          conversationId: "conv_done",
          messageId: "msg_done",
          buffer: "Answer",
          status: "streaming",
        },
      });
      useChatStore.getState().finaliseStream();
      const updated =
        useChatStore.getState().messagesByConversationId["conv_done"]![0];
      expect(updated.content).toBe("Answer");
      expect(updated.status).toBe("done");
    });

    it("finaliseStream is a no-op when streamState is null", () => {
      const msg = makeMessage({ id: "msg_orphan", role: "assistant" });
      useChatStore.setState({
        messagesByConversationId: { conv_orphan: [msg] },
      });
      // Should not throw
      useChatStore.getState().finaliseStream();
      expect(
        useChatStore.getState().messagesByConversationId["conv_orphan"]![0]
          .content,
      ).toBe("");
    });

    it("failStream marks the message as error and keeps streamState with error status", () => {
      const msg = makeMessage({
        id: "msg_fail",
        role: "assistant",
        content: "",
      });
      useChatStore.setState({
        messagesByConversationId: { conv_fail: [msg] },
        streamState: {
          conversationId: "conv_fail",
          messageId: "msg_fail",
          buffer: "",
          status: "streaming",
        },
      });

      useChatStore.getState().failStream("Network error");

      const updated =
        useChatStore.getState().messagesByConversationId["conv_fail"]![0];
      expect(updated.status).toBe("error");
      expect(updated.content).toBe("");
      expect(useChatStore.getState().streamState?.status).toBe("error");
    });

    it("failStream is a no-op when streamState is null", () => {
      useChatStore.getState().failStream("error");
      expect(useChatStore.getState().streamState).toBeNull();
    });
  });

  describe("filters", () => {
    it("setActiveFilters replaces filters", () => {
      useChatStore.getState().setActiveFilters({ documentIds: ["doc_1"] });
      expect(useChatStore.getState().activeFilters).toEqual({
        documentIds: ["doc_1"],
      });
    });

    it("clearActiveFilters resets to empty object", () => {
      useChatStore.setState({ activeFilters: { documentIds: ["doc_1"] } });
      useChatStore.getState().clearActiveFilters();
      expect(useChatStore.getState().activeFilters).toEqual({});
    });
  });

  describe("draft & UI state", () => {
    it("setDraftMessage updates draftMessage", () => {
      useChatStore.getState().setDraftMessage("Hello there!");
      expect(useChatStore.getState().draftMessage).toBe("Hello there!");
    });

    it("setVisibleFollowupMessageId sets the id", () => {
      useChatStore.getState().setVisibleFollowupMessageId("msg_followup");
      expect(useChatStore.getState().visibleFollowupMessageId).toBe(
        "msg_followup",
      );
    });

    it("setVisibleFollowupMessageId can set null", () => {
      useChatStore.setState({ visibleFollowupMessageId: "msg_followup" });
      useChatStore.getState().setVisibleFollowupMessageId(null);
      expect(useChatStore.getState().visibleFollowupMessageId).toBeNull();
    });
  });

  describe("feedback", () => {
    it("setFeedbackSubmitted records a positive rating", () => {
      useChatStore.getState().setFeedbackSubmitted("msg_1", "positive");
      expect(useChatStore.getState().submittedFeedback["msg_1"]).toBe(
        "positive",
      );
    });

    it("setFeedbackSubmitted records a negative rating", () => {
      useChatStore.getState().setFeedbackSubmitted("msg_2", "negative");
      expect(useChatStore.getState().submittedFeedback["msg_2"]).toBe(
        "negative",
      );
    });

    it("setFeedbackSubmitted can overwrite a rating", () => {
      useChatStore.getState().setFeedbackSubmitted("msg_1", "positive");
      useChatStore.getState().setFeedbackSubmitted("msg_1", "negative");
      expect(useChatStore.getState().submittedFeedback["msg_1"]).toBe(
        "negative",
      );
    });
  });
});
