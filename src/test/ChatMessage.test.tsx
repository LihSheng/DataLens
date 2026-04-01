import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatMessage } from "../features/chat/components/ChatMessage";
import { useChatStore } from "../features/chat/store";
import type { Message } from "../types";

const queryClient = new QueryClient();

const userMessage: Message = {
  id: "msg_1",
  conversationId: "conv_1",
  role: "user",
  content: "Hello, what is RAG?",
  createdAt: "2024-11-01T09:00:00Z",
};

const assistantMessage: Message = {
  id: "msg_2",
  conversationId: "conv_1",
  role: "assistant",
  content:
    "RAG stands for Retrieval-Augmented Generation. It combines a retrieval system with a language model to produce more accurate answers.",
  createdAt: "2024-11-01T09:01:00Z",
};

const assistantMessageWithSources: Message = {
  id: "msg_3",
  conversationId: "conv_1",
  role: "assistant",
  content:
    "The system supports PDF, DOCX, TXT, and Markdown formats for document upload [1][2].",
  sources: [
    {
      documentId: "doc_1",
      documentName: "Product Requirements Q3.pdf",
      chunkText: "Supported formats: PDF, DOCX, TXT, MD",
      pageNumber: 3,
      relevanceScore: 0.92,
    },
    {
      documentId: "doc_2",
      documentName: "API Reference v2.docx",
      chunkText: "Upload endpoint accepts PDF, DOCX, TXT, MD",
      pageNumber: 12,
      relevanceScore: 0.88,
    },
  ],
  createdAt: "2024-11-01T09:02:00Z",
};

describe("ChatMessage", () => {
  it("renders streaming cursor when streamState is active", () => {
    useChatStore.setState({
      streamState: {
        conversationId: assistantMessage.conversationId,
        messageId: assistantMessage.id,
        buffer: assistantMessage.content,
        status: "streaming",
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={assistantMessage} />
      </QueryClientProvider>,
    );
    // Streaming cursor is a span with bg-primary and animate-pulse
    const streamingCursors = document.querySelectorAll(
      "span.bg-primary.animate-pulse",
    );
    expect(streamingCursors.length).toBe(1);
  });

  it("does not render streaming cursor when streamState is absent", () => {
    useChatStore.setState({ streamState: null });

    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={assistantMessage} />
      </QueryClientProvider>,
    );
    // The streaming cursor is the span with bg-primary and animate-pulse
    // When streamState is null, no such element should exist
    const streamingCursors = document.querySelectorAll(
      "span.bg-primary.animate-pulse",
    );
    expect(streamingCursors.length).toBe(0);
  });

  it("renders user message with correct styling", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={userMessage} />
      </QueryClientProvider>,
    );

    // Find the outer flex container (the one with justify-end for user messages)
    // The user message bubble has rounded-br-md class
    const bubble = document.querySelector(".rounded-br-md");
    expect(bubble).toBeInTheDocument();
    // The outer flex container is the parent of the inner flex column container
    const outerFlex = bubble?.parentElement?.parentElement;
    expect(outerFlex).toHaveClass("justify-end");
  });

  it("renders assistant message with correct styling", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={assistantMessage} />
      </QueryClientProvider>,
    );

    // Find the outer flex container for assistant (should have justify-start)
    // Assistant bubble has rounded-bl-md
    const bubble = document.querySelector(".rounded-bl-md");
    expect(bubble).toBeInTheDocument();
    const outerFlex = bubble?.parentElement?.parentElement;
    expect(outerFlex).toHaveClass("justify-start");
  });

  it("renders timestamp span for user message", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={userMessage} />
      </QueryClientProvider>,
    );
    // The timestamp is rendered as a span with text-muted-foreground class
    const timestamp = document.querySelector(".text-muted-foreground");
    expect(timestamp).toBeInTheDocument();
  });

  it("renders timestamp span for assistant message", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={assistantMessage} />
      </QueryClientProvider>,
    );
    // The outer container for assistant message has justify-start
    // Find the text-muted-foreground timestamp inside
    const timestamps = document.querySelectorAll(".text-muted-foreground");
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it("renders CopyButton for assistant message (not user)", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={assistantMessage} />
      </QueryClientProvider>,
    );
    const copyButton = screen.getByRole("button", { name: /copy/i });
    expect(copyButton).toBeInTheDocument();
  });

  it("does not render CopyButton for user message", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={userMessage} />
      </QueryClientProvider>,
    );
    expect(
      screen.queryByRole("button", { name: /copy/i }),
    ).not.toBeInTheDocument();
  });

  it("renders citation chips for messages with sources", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessage message={assistantMessageWithSources} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("[1]")).toBeInTheDocument();
    expect(screen.getByText("[2]")).toBeInTheDocument();
  });
});
