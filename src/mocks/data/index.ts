// Re-export all mock data modules
// Note: conversations re-exports types from ../types; documents re-exports
// types from ../types. The observability module (MOCK_FEEDBACK_STATS etc.)
// is consumed directly by the observability and feedback handlers.
export * from "./conversations";
export * from "./documents";
export * from "./settings";
export * from "./users";
// Observability data is consumed by handlers/observability.ts and
// handlers/feedback.ts — no separate index re-export needed.
