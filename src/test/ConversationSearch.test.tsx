import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConversationSearchInput } from "../features/chat/components/ConversationSearchInput";
import { ConversationSearchResults } from "../features/chat/components/ConversationSearchResults";
import type { ConversationSearchResult } from "../types";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

const mockResults: ConversationSearchResult[] = [
  {
    id: "conv_1",
    title: "Document upload requirements",
    createdAt: "2024-11-01T09:00:00Z",
    updatedAt: "2024-11-01T09:15:00Z",
    snippet: "What file formats does the system support?",
  },
  {
    id: "conv_2",
    title: "API authentication flow",
    createdAt: "2024-10-28T14:30:00Z",
    updatedAt: "2024-10-28T14:45:00Z",
    snippet: "How does authentication work?",
  },
];

// Wrapper that tracks onChange calls and accumulates value like a real component
function StatefulWrapper({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div>
      <ConversationSearchInput value={value} onChange={setValue} />
      <ConversationSearchResults
        results={mockResults}
        isLoading={false}
        isError={false}
        query={value}
      />
    </div>
  );
}

describe("ConversationSearchInput", () => {
  it("renders search input with placeholder", () => {
    renderWithProviders(
      <ConversationSearchInput value="" onChange={() => {}} />,
    );
    expect(
      screen.getByPlaceholderText(/search conversations/i),
    ).toBeInTheDocument();
  });

  it("calls onChange when user types", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <ConversationSearchInput value="" onChange={onChange} />,
    );

    const input = screen.getByPlaceholderText(/search conversations/i);
    // userEvent.type fires onChange per character
    await user.type(input, "test query");

    // Called once per character typed
    expect(onChange).toHaveBeenCalledTimes(10);
  });

  it("shows clear button when input has value", async () => {
    const { user } = renderWithProviders(
      <StatefulWrapper initialValue="test" />,
    );

    const clearButton = screen.getByRole("button", { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    // Input should be empty after clear — state updated via setValue
    const input = screen.getByPlaceholderText(/search conversations/i);
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("shows loading spinner when isLoading is true", () => {
    renderWithProviders(
      <ConversationSearchInput
        value="test"
        onChange={() => {}}
        isLoading={true}
      />,
    );
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});

describe("ConversationSearchResults", () => {
  it("returns null when query is empty", () => {
    const { container } = renderWithProviders(
      <ConversationSearchResults
        results={mockResults}
        isLoading={false}
        isError={false}
        query=""
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state with spinner", () => {
    renderWithProviders(
      <ConversationSearchResults
        results={[]}
        isLoading={true}
        isError={false}
        query="test"
      />,
    );
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows error message when isError is true", () => {
    renderWithProviders(
      <ConversationSearchResults
        results={[]}
        isLoading={false}
        isError={true}
        query="test"
      />,
    );
    expect(screen.getByText(/search failed/i)).toBeInTheDocument();
  });

  it("shows empty state when no results match query", () => {
    renderWithProviders(
      <ConversationSearchResults
        results={[]}
        isLoading={false}
        isError={false}
        query="nonexistent"
      />,
    );
    expect(screen.getByText(/no conversations matching/i)).toBeInTheDocument();
  });

  it("displays search result titles and snippets", () => {
    renderWithProviders(
      <ConversationSearchResults
        results={mockResults}
        isLoading={false}
        isError={false}
        query="test"
      />,
    );

    expect(
      screen.getByText("Document upload requirements"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("What file formats does the system support?"),
    ).toBeInTheDocument();
    expect(screen.getByText("API authentication flow")).toBeInTheDocument();
    expect(
      screen.getByText("How does authentication work?"),
    ).toBeInTheDocument();
  });

  it("renders Results label above results", () => {
    renderWithProviders(
      <ConversationSearchResults
        results={mockResults}
        isLoading={false}
        isError={false}
        query="test"
      />,
    );
    expect(screen.getByText(/^results$/i)).toBeInTheDocument();
  });
});
