/**
 * apiClient — single canonical request layer.
 *
 * - toApiUrl(path): canonical URL builder (respects VITE_API_BASE_URL)
 * - apiErrorFromUnknown(err): normalizes Axios/fetch/unknown errors to ApiError
 * - apiFetchStream(path, options): streaming fetch for SSE/chat (uses toApiUrl + auth)
 *
 * All JSON APIs should use httpClient directly.
 * Only SSE/streaming endpoints should use apiFetchStream.
 */

import { httpClient } from "./httpClient";
import { config } from "../lib/config";
import { useAuthStore } from "../features/auth/store";
import type { ApiError } from "../types";

// ─── Canonical URL builder ───────────────────────────────────────────────────

/**
 * In dev (MSW): apiBaseUrl is empty → "/api/foo" stays as-is (MSW intercepts).
 * In prod: apiBaseUrl is set → "/api/foo" → "{origin}/api/foo"
 */
export function toApiUrl(path: string): string {
  const base = config.apiBaseUrl.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

// ─── Error normalization ────────────────────────────────────────────────────

/**
 * Normalize any error (Axios, fetch, TypeError, unknown) into a consistent ApiError.
 * UI code can switch on error.code / error.status without caring about the source.
 */
export function apiErrorFromUnknown(err: unknown): ApiError {
  // Axios error with response
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as {
      response?: {
        status?: number;
        data?: { message?: string; error?: string; detail?: string };
      };
    };
    return {
      message:
        axiosErr.response?.data?.message ??
        axiosErr.response?.data?.error ??
        axiosErr.response?.data?.detail ??
        `Request failed (${axiosErr.response?.status ?? "unknown"})`,
      code: axiosErr.response?.data?.error,
      status: axiosErr.response?.status,
    };
  }
  // Axios error without response (network error)
  if (err && typeof err === "object" && "request" in err) {
    return {
      message: "Network error — is the backend available?",
      code: "NETWORK_ERROR",
    };
  }
  // Standard Error
  if (err instanceof Error) {
    return { message: err.message };
  }
  // String
  if (typeof err === "string") {
    return { message: err };
  }
  // Unknown
  return { message: "An unexpected error occurred" };
}

// ─── Streaming fetch for SSE ─────────────────────────────────────────────────

/**
 * Streaming fetch for SSE/chat endpoints only.
 * Routes through toApiUrl (respects apiBaseUrl) and injects Authorization header.
 * Returns a ReadableStream that emits parsed SSE data events.
 */
export function apiFetchStream(
  path: string,
  options: RequestInit = {},
): ReadableStream {
  const url = toApiUrl(path);
  const token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      fetch(url, { ...options, headers })
        .then((response) => {
          if (!response.body) {
            controller.close();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          function read() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    controller.enqueue(
                      encoder.encode(JSON.stringify(data) + "\n"),
                    );
                  } catch {
                    // skip incomplete JSON
                  }
                }
              }

              read();
            });
          }

          read();
        })
        .catch(() => controller.close());
    },
  });
}

// ─── Re-export httpClient for convenience ────────────────────────────────────

export { httpClient };
