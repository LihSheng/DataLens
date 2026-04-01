import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ObservabilityPage } from "../pages/ObservabilityPage";
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
  // Clear localStorage so persist middleware rehydrates empty state,
  // then set the desired test state on the store.
  localStorage.clear();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
});

describe("ObservabilityPage — admin visibility", () => {
  it("shows locked screen when user is not authenticated", () => {
    renderWithProviders(<ObservabilityPage />);

    // Non-authenticated — locked screen
    expect(screen.getByText(/admin access required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you need admin privileges to view observability/i),
    ).toBeInTheDocument();
  });

  it("shows locked screen when user is authenticated but not admin", () => {
    useAuthStore.setState({
      user: {
        id: "usr_2",
        email: "bob@example.com",
        name: "Bob Martinez",
        role: "user",
      },
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<ObservabilityPage />);

    expect(screen.getByText(/admin access required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you need admin privileges to view observability/i),
    ).toBeInTheDocument();
  });

  it("admin sees observability tabs and content", async () => {
    useAuthStore.setState({
      user: {
        id: "usr_1",
        email: "alice@example.com",
        name: "Alice Chen",
        role: "admin",
      },
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<ObservabilityPage />);

    // Page header
    expect(
      screen.getByRole("heading", { name: /observability/i }),
    ).toBeInTheDocument();

    // Tabs visible — use exact name to avoid matching "Run Evaluation" button
    expect(
      screen.getByRole("button", { name: /^Evaluation$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Feedback$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Cost$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Audit Log$/i }),
    ).toBeInTheDocument();
  });

  it("admin defaults to evaluation tab showing golden dataset section", async () => {
    useAuthStore.setState({
      user: {
        id: "usr_1",
        email: "alice@example.com",
        name: "Alice Chen",
        role: "admin",
      },
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<ObservabilityPage />);

    // Default tab is "evaluation" — should show golden dataset heading
    expect(screen.getByText(/golden dataset evaluation/i)).toBeInTheDocument();
    // No locked screen
    expect(
      screen.queryByText(/admin access required/i),
    ).not.toBeInTheDocument();
  });

  it("admin can switch to feedback tab", async () => {
    useAuthStore.setState({
      user: {
        id: "usr_1",
        email: "alice@example.com",
        name: "Alice Chen",
        role: "admin",
      },
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    const { user } = renderWithProviders(<ObservabilityPage />);
    await user.click(screen.getByRole("button", { name: /^Feedback$/i }));
    expect(screen.getByText(/feedback overview/i)).toBeInTheDocument();
  });

  it("admin can switch to cost tab", async () => {
    useAuthStore.setState({
      user: {
        id: "usr_1",
        email: "alice@example.com",
        name: "Alice Chen",
        role: "admin",
      },
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    const { user } = renderWithProviders(<ObservabilityPage />);
    await user.click(screen.getByRole("button", { name: /^Cost$/i }));
    expect(screen.getByText(/cost summary/i)).toBeInTheDocument();
  });

  it("admin can switch to audit tab", async () => {
    useAuthStore.setState({
      user: {
        id: "usr_1",
        email: "alice@example.com",
        name: "Alice Chen",
        role: "admin",
      },
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    const { user } = renderWithProviders(<ObservabilityPage />);
    await user.click(screen.getByRole("button", { name: /^Audit Log$/i }));
    expect(
      screen.getByRole("heading", { name: /audit log/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/search and export security/i)).toBeInTheDocument();
  });
});
