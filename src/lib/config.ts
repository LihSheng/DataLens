export const config = {
  // In dev, leave empty so MSW intercepts /api/* requests.
  // Set VITE_API_BASE_URL in .env.production to point to the real backend.
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  sentryDsn: import.meta.env.VITE_SENTRY_DSN ?? "",
  appEnv: import.meta.env.VITE_APP_ENV ?? "development",
} as const;

export type AppEnv = "development" | "preview" | "production";
