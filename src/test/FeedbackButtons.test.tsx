import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FeedbackButtons } from "../features/chat/components/FeedbackButtons";
import { useChatStore } from "../features/chat/store";
import type { Message } from "../types";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
}

const baseMessage: Message = {
  id: "msg_test_1",
  conversationId: "conv_test",
  role: "assistant",
  content: "This is a test assistant message.",
  createdAt: "2024-11-01T09:00:00Z",
};

beforeEach(() => {
  useChatStore.setState({ submittedFeedback: {} });
  vi.clearAllMocks();
});

describe("FeedbackButtons", () => {
  it("renders thumbs up and thumbs down buttons by default", () => {
    renderWithProviders(<FeedbackButtons message={baseMessage} />);

    expect(
      screen.getByRole("button", { name: /good response/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /bad response/i }),
    ).toBeInTheDocument();
  });

  it("shows FeedbackSubmittedState when already submitted via store", () => {
    useChatStore.setState({
      submittedFeedback: { [baseMessage.id]: "positive" },
    });

    renderWithProviders(<FeedbackButtons message={baseMessage} />);

    expect(
      screen.getByText(/thank you for your feedback/i),
    ).toBeInTheDocument();
    // Buttons should not appear
    expect(
      screen.queryByRole("button", { name: /good response/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /bad response/i }),
    ).not.toBeInTheDocument();
  });

  it("shows NegativeFeedbackForm when thumbs down is clicked", async () => {
    const { user } = renderWithProviders(
      <FeedbackButtons message={baseMessage} />,
    );

    await user.click(screen.getByRole("button", { name: /bad response/i }));

    // The form should now be visible with a textarea
    expect(
      screen.getByPlaceholderText(/optional feedback/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("NegativeFeedbackForm has a comment textarea limited to 200 characters", async () => {
    const { user } = renderWithProviders(
      <FeedbackButtons message={baseMessage} />,
    );

    await user.click(screen.getByRole("button", { name: /bad response/i }));

    const textarea = screen.getByPlaceholderText(/optional feedback/i);
    expect(textarea).toBeInTheDocument();

    // Type a long comment
    const longComment = "a".repeat(250);
    await user.type(textarea, longComment);

    // Value should be truncated to MAX_CHARS (200)
    expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(
      200,
    );
    // Character counter should reflect truncation
    expect(screen.getByText(/\/200$/)).toBeInTheDocument();
  });

  it("NegativeFeedbackForm cancel returns to default button state", async () => {
    const { user } = renderWithProviders(
      <FeedbackButtons message={baseMessage} />,
    );

    await user.click(screen.getByRole("button", { name: /bad response/i }));
    expect(
      screen.getByPlaceholderText(/optional feedback/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Back to default — thumbs buttons visible again
    expect(
      screen.getByRole("button", { name: /good response/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /bad response/i }),
    ).toBeInTheDocument();
  });

  it("shows FeedbackSubmittedState optimistically when thumbs up is clicked", async () => {
    const { user } = renderWithProviders(
      <FeedbackButtons message={baseMessage} />,
    );

    await user.click(screen.getByRole("button", { name: /good response/i }));

    // Optimistic state — thank you message shown immediately
    expect(
      screen.getByText(/thank you for your feedback/i),
    ).toBeInTheDocument();
  });
});
