import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KnowledgeBasePage } from "../pages/KnowledgeBasePage";
import { useAuthStore } from "../features/auth/store";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  useAuthStore.setState({
    user: { id: "1", email: "test@example.com", name: "Test" },
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
  localStorage.clear();
});

describe("KnowledgeBasePage — search and filter composition", () => {
  it("renders the page with the upload section and table", async () => {
    renderWithProviders(<KnowledgeBasePage />);

    // Upload zone should be visible
    expect(
      screen.getByRole("button", { name: /upload files/i }),
    ).toBeInTheDocument();

    // Search input should be present
    expect(
      screen.getByPlaceholderText(/search documents/i),
    ).toBeInTheDocument();
  });

  it("shows all documents when no filters are applied", async () => {
    renderWithProviders(<KnowledgeBasePage />);

    // Wait for documents to load from MSW
    await waitFor(() => {
      expect(
        screen.getByText("Product Requirements Q3.pdf"),
      ).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    // header row + 5 data rows
    expect(rows.length).toBe(6);
  });

  it("filters documents by search query", async () => {
    const { user } = renderWithProviders(<KnowledgeBasePage />);

    await waitFor(() => {
      expect(
        screen.getByText("Product Requirements Q3.pdf"),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search documents/i);
    await user.type(searchInput, "API");

    // Should only show the API Reference document
    expect(
      screen.queryByText("Product Requirements Q3.pdf"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("API Reference v2.docx")).toBeInTheDocument();
  });

  it("filters documents by status filter", async () => {
    const { user } = renderWithProviders(<KnowledgeBasePage />);

    await waitFor(() => {
      expect(
        screen.getByText("Product Requirements Q3.pdf"),
      ).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole("combobox");
    await user.selectOptions(statusSelect, "ready");

    // Should only show ready documents
    expect(screen.getByText("Product Requirements Q3.pdf")).toBeInTheDocument();
    expect(screen.getByText("API Reference v2.docx")).toBeInTheDocument();
    expect(screen.queryByText("Deployment Guide.txt")).not.toBeInTheDocument();
    expect(screen.queryByText("Invalid Format.csv")).not.toBeInTheDocument();
  });

  it("composes search and status filter together", async () => {
    const { user } = renderWithProviders(<KnowledgeBasePage />);

    await waitFor(() => {
      expect(
        screen.getByText("Product Requirements Q3.pdf"),
      ).toBeInTheDocument();
    });

    // Type search for "Product" and filter by "ready"
    const searchInput = screen.getByPlaceholderText(/search documents/i);
    await user.type(searchInput, "Product");

    const statusSelect = screen.getByRole("combobox");
    await user.selectOptions(statusSelect, "ready");

    // Should show Product Requirements (ready) but not Invalid Format (failed)
    expect(screen.getByText("Product Requirements Q3.pdf")).toBeInTheDocument();
    expect(screen.queryByText("Invalid Format.csv")).not.toBeInTheDocument();
  });

  it("shows empty state when search/filter returns no results", async () => {
    const { user } = renderWithProviders(<KnowledgeBasePage />);

    await waitFor(() => {
      expect(
        screen.getByText("Product Requirements Q3.pdf"),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search documents/i);
    await user.type(searchInput, "nonexistent_document_xyz");

    expect(
      screen.getByText(/no documents match your filters/i),
    ).toBeInTheDocument();
  });

  it("shows delete confirmation dialog when delete button is clicked", async () => {
    const { user } = renderWithProviders(<KnowledgeBasePage />);

    await waitFor(() => {
      expect(
        screen.getByText("Product Requirements Q3.pdf"),
      ).toBeInTheDocument();
    });

    // Find the action menu button (MoreVertical 3-dot) in the first data row
    const tableRows = screen.getAllByRole("row");
    const firstDataRow = tableRows[1];
    const menuButton = firstDataRow.querySelector("button");
    expect(menuButton).not.toBeNull();

    // Open the action dropdown
    await user.click(menuButton!);

    // Wait for the floating dropdown to appear, then click Delete
    const deleteButton = await waitFor(() =>
      screen.getByRole("button", { name: /delete$/i }),
    );
    await user.click(deleteButton);

    // Confirm dialog should appear with the correct title
    await waitFor(() => {
      expect(screen.getByText(/delete document/i)).toBeInTheDocument();
    });
  });

  it("confirm dialog has cancel and delete buttons", async () => {
    const { user } = renderWithProviders(<KnowledgeBasePage />);

    await waitFor(() => {
      expect(
        screen.getByText("Product Requirements Q3.pdf"),
      ).toBeInTheDocument();
    });

    // Open the action dropdown for the first data row
    const tableRows = screen.getAllByRole("row");
    const firstDataRow = tableRows[1];
    const menuButton = firstDataRow.querySelector("button")!;
    await user.click(menuButton);

    // Click Delete from the dropdown
    const deleteButton = await waitFor(() =>
      screen.getByRole("button", { name: /delete$/i }),
    );
    await user.click(deleteButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /^delete$/i }),
    ).toBeInTheDocument();
  });
});
