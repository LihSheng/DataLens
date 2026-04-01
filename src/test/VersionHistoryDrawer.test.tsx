import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VersionHistoryDrawer } from "../features/knowledge/components/VersionHistoryDrawer";

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

describe("VersionHistoryDrawer", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = renderWithProviders(
      <VersionHistoryDrawer
        documentId="doc_1"
        isOpen={false}
        onClose={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading spinner while versions are loading", async () => {
    renderWithProviders(
      <VersionHistoryDrawer
        documentId="doc_1"
        isOpen={true}
        onClose={() => {}}
      />,
    );

    // Should show spinner initially
    await waitFor(() => {
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  it("renders version list once loaded (doc_1 has 2 versions, v2 is active)", async () => {
    renderWithProviders(
      <VersionHistoryDrawer
        documentId="doc_1"
        isOpen={true}
        onClose={() => {}}
      />,
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/version 1/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/version 1/i)).toBeInTheDocument();
    expect(screen.getByText(/version 2/i)).toBeInTheDocument();
  });

  it("marks the active version with Active badge", async () => {
    renderWithProviders(
      <VersionHistoryDrawer
        documentId="doc_1"
        isOpen={true}
        onClose={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/version 2/i)).toBeInTheDocument();
    });

    // Version 2 is active for doc_1
    const version2Label = screen.getByText(/version 2/i);
    expect(version2Label.nextSibling).toHaveTextContent("Active");
  });

  it("renders status icons for each version", async () => {
    renderWithProviders(
      <VersionHistoryDrawer
        documentId="doc_1"
        isOpen={true}
        onClose={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/version 1/i)).toBeInTheDocument();
    });

    // Both versions should have a status icon (CheckCircle2 for ready status)
    // doc_1 versions are both 'ready' so they show CheckCircle2
    const checkIcons = document.querySelectorAll("svg.text-emerald-500");
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it("closes when close button is clicked", async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <VersionHistoryDrawer
        documentId="doc_1"
        isOpen={true}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/version 1/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when document has no versions", async () => {
    renderWithProviders(
      <VersionHistoryDrawer
        documentId="doc_unknown"
        isOpen={true}
        onClose={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/version/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no versions found/i)).toBeInTheDocument();
  });
});
