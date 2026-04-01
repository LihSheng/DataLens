import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { useUIStore } from "../store/uiStore";

beforeEach(() => {
  useUIStore.setState({
    isSidebarOpen: true,
    isSidebarCollapsed: false,
    isConversationsDrawerOpen: false,
    activeModal: null,
    toasts: [],
    isDarkMode: false,
    sourcePanel: { isOpen: false, highlightedSourceId: null },
  });
});

// ─── AppLayout ────────────────────────────────────────────────────────────────

describe("AppLayout", () => {
  const renderAppLayout = () =>
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

  it("renders the full-screen background div", () => {
    renderAppLayout();
    expect(
      document.querySelector(".min-h-screen.bg-background"),
    ).toBeInTheDocument();
  });

  it("renders a Sidebar element", () => {
    renderAppLayout();
    // Sidebar is a nav element in the app
    const sidebar = document.querySelector("nav");
    expect(sidebar).toBeInTheDocument();
  });

  it("renders a Header element", () => {
    renderAppLayout();
    expect(document.querySelector("header")).toBeInTheDocument();
  });

  it("renders main with p-4 class", () => {
    renderAppLayout();
    expect(document.querySelector("main.p-4")).toBeInTheDocument();
  });

  it("applies lg:pl-64 when sidebar is not collapsed", () => {
    useUIStore.setState({ isSidebarCollapsed: false });
    renderAppLayout();
    expect(document.querySelector(".lg\\:pl-64")).toBeInTheDocument();
  });

  it("applies lg:pl-16 when sidebar is collapsed", () => {
    useUIStore.setState({ isSidebarCollapsed: true });
    renderAppLayout();
    expect(document.querySelector(".lg\\:pl-16")).toBeInTheDocument();
  });

  it("applies transition-all duration-200 on main content area", () => {
    renderAppLayout();
    expect(
      document.querySelector(".transition-all.duration-200"),
    ).toBeInTheDocument();
  });
});

// ─── AuthLayout ───────────────────────────────────────────────────────────────

describe("AuthLayout", () => {
  it("renders the RAG Assistant heading", () => {
    render(<AuthLayout />);
    expect(
      screen.getByRole("heading", { name: "RAG Assistant" }),
    ).toBeInTheDocument();
  });

  it("renders the sign-in subtitle text", () => {
    render(<AuthLayout />);
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
  });

  it("renders Bot icon in a rounded-xl container", () => {
    render(<AuthLayout />);
    const iconContainer = document.querySelector(".rounded-xl");
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.querySelector("svg")).toBeInTheDocument();
  });

  it("centers content with min-h-screen flex layout", () => {
    render(<AuthLayout />);
    const flexContainer = document.querySelector(
      ".min-h-screen.items-center.justify-center",
    );
    expect(flexContainer).toBeInTheDocument();
  });

  it("has a max-w-sm centered card", () => {
    render(<AuthLayout />);
    expect(document.querySelector(".max-w-sm")).toBeInTheDocument();
  });
});
