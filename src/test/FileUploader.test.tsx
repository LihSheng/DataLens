import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FileUploader } from "../features/knowledge/components/FileUploader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("FileUploader", () => {
  it("renders the drop zone with correct aria-label", () => {
    renderWithProviders(<FileUploader />);
    expect(
      screen.getByRole("button", { name: /upload files/i }),
    ).toBeInTheDocument();
  });

  it("shows accepted file types in helper text", () => {
    renderWithProviders(<FileUploader />);
    expect(
      screen.getByText("PDF, DOCX, TXT, MD — max 10 MB each"),
    ).toBeInTheDocument();
  });

  it("rejects files with unsupported extension and shows error", () => {
    renderWithProviders(<FileUploader />);

    const file = new File(["hello"], "data.csv", { type: "text/csv" });
    const input = document.getElementById("file-input") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
    expect(screen.getByText(/data\.csv/i)).toBeInTheDocument();
  });

  it("rejects files with unsupported MIME type", () => {
    renderWithProviders(<FileUploader />);

    // File with wrong type (spreadsheet, not document)
    const file = new File(["hello"], "report.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const input = document.getElementById("file-input") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
  });

  it("does not show error when no invalid files are selected", () => {
    renderWithProviders(<FileUploader />);

    const file = new File(["hello"], "report.pdf", { type: "application/pdf" });
    const input = document.getElementById("file-input") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(
      screen.queryByText(/unsupported file type/i),
    ).not.toBeInTheDocument();
  });

  it("dismisses error by clicking the X button", () => {
    renderWithProviders(<FileUploader />);

    // First trigger an error
    const badFile = new File(["hello"], "bad.csv", { type: "text/csv" });
    const input = document.getElementById("file-input") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();

    // Dismiss error
    const dismissBtn = screen.getByRole("button", { name: /dismiss error/i });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText(/unsupported file type/i),
    ).not.toBeInTheDocument();
  });
});
