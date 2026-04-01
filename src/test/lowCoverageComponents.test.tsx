import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CachePill } from "../features/chat/components/CachePill";
import { ModelBadge } from "../features/chat/components/ModelBadge";
import { MemoryIndicator } from "../features/chat/components/MemoryIndicator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettingsStore } from "../features/settings/store";

const queryClient = new QueryClient();

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("CachePill", () => {
  it("renders 'Cached' text", () => {
    render(<CachePill />);
    expect(screen.getByText("Cached")).toBeInTheDocument();
  });

  it("applies the title tooltip", () => {
    render(<CachePill />);
    const el = document.querySelector(
      '[title="This answer was retrieved from cache"]',
    );
    expect(el).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    const { container } = render(<CachePill className="mt-2" />);
    expect(container.firstChild).toHaveClass("mt-2");
  });

  it("has correct badge styling classes", () => {
    render(<CachePill />);
    const el = document.querySelector(".inline-flex.items-center");
    expect(el).toBeInTheDocument();
  });
});

describe("ModelBadge", () => {
  it("renders the model name as text", () => {
    render(<ModelBadge model="gpt-4o-mini" />);
    expect(screen.getByText("gpt-4o-mini")).toBeInTheDocument();
  });

  it("applies title with model name", () => {
    render(<ModelBadge model="claude-3-opus" />);
    const el = document.querySelector('[title="Routed to claude-3-opus"]');
    expect(el).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    const { container } = render(
      <ModelBadge model="gpt-4" className="text-lg" />,
    );
    expect(container.firstChild).toHaveClass("text-lg");
  });

  it("renders with badge styling classes", () => {
    render(<ModelBadge model="test-model" />);
    const el = document.querySelector(".inline-flex.items-center.rounded-full");
    expect(el).toBeInTheDocument();
  });
});

describe("MemoryIndicator", () => {
  function renderMemoryIndicator(messageCount: number) {
    return render(
      <AllTheProviders>
        <MemoryIndicator messageCount={messageCount} />
      </AllTheProviders>,
    );
  }

  beforeEach(() => {
    // Reset settings store to default
    useSettingsStore.setState({
      settings: {
        modelName: "gpt-4o-mini",
        topK: 5,
        temperature: 0.7,
        maxTokens: 2048,
        showSourcesPanel: true,
        enableStreaming: true,
        hybridWeightDense: 0.5,
        rerankerEnabled: false,
        queryExpansionEnabled: false,
        hydeEnabled: false,
        chunkingStrategy: "semantic",
        confidenceThreshold: 0.5,
        memoryWindow: 5,
        conversationRetentionDays: 30,
      },
    });
  });

  it("returns null (renders nothing) when messageCount is 0", () => {
    const { container } = renderMemoryIndicator(0);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when messageCount is negative", () => {
    const { container } = renderMemoryIndicator(-1);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Brain icon and Memory active text when messageCount >= 1", () => {
    renderMemoryIndicator(1);
    expect(screen.getByText("Memory active")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument(); // Brain icon
  });

  it("displays the message count", () => {
    renderMemoryIndicator(3);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows the correct memory window from settings in the title tooltip", () => {
    useSettingsStore.setState({
      settings: { ...useSettingsStore.getState().settings, memoryWindow: 10 },
    });
    renderMemoryIndicator(1);
    const el = document.querySelector('[title*="Memory window: 10 messages"]');
    expect(el).toBeInTheDocument();
  });

  it("uses singular 'message' when memoryWindow is 1", () => {
    useSettingsStore.setState({
      settings: { ...useSettingsStore.getState().settings, memoryWindow: 1 },
    });
    renderMemoryIndicator(1);
    const el = document.querySelector('[title*="Memory window: 1 message"]');
    expect(el).toBeInTheDocument();
  });

  it("renders with tabular-nums class for the count span", () => {
    renderMemoryIndicator(7);
    const countSpan = document.querySelector(".tabular-nums");
    expect(countSpan).toBeInTheDocument();
  });
});
