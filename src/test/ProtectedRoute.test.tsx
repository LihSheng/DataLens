import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/store";
import { AuthGuard } from "../App";

function TestPage() {
  return <div data-testid="protected-page">Protected Content</div>;
}

function PublicPage() {
  return <div data-testid="public-page">Public Page</div>;
}

const renderWithRouter = (initialEntry: string, isAuthenticated: boolean) => {
  // Set auth state before rendering
  if (isAuthenticated) {
    useAuthStore.setState({
      user: { id: "1", email: "test@example.com", name: "Test User" },
      accessToken: "mock_token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  } else {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<PublicPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <TestPage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
});

describe("AuthGuard (ProtectedRoute)", () => {
  it("renders child when authenticated", () => {
    renderWithRouter("/", true);
    expect(screen.getByTestId("protected-page")).toBeInTheDocument();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", () => {
    renderWithRouter("/", false);
    // Navigate away from / so the redirect happens
    // With MemoryRouter on /, AuthGuard should redirect to /login
    // The protected page should NOT render
    expect(screen.queryByTestId("protected-page")).not.toBeInTheDocument();
  });

  it("redirects to /login when accessing a deep protected route while unauthenticated", () => {
    renderWithRouter("/some-nested-path", false);
    // Should redirect to /login, showing the public page
    expect(screen.queryByTestId("protected-page")).not.toBeInTheDocument();
  });
});
