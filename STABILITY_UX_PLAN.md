# DataLens Stability + UX Standardization Plan

## Goal
Make frontend ↔ backend behavior consistent across environments (dev/MSW, local backend, preview/prod). Reduce “random page breaks” caused by mixed request styles. Improve UX around loading, errors, and long-running/streaming actions.

## Current Pain Points (Observed)
- FE uses mixed networking:
  - Axios `httpClient` with `config.apiBaseUrl` + auth interceptors.
  - Raw `fetch('/api/...')` calls that ignore `config.apiBaseUrl` and bypass auth + standard errors.
- Environment behavior differs:
  - In dev, MSW intercepts `/api/*`.
  - In preview/prod, `/api/*` may hit the frontend origin unless explicitly proxied; this breaks if backend is separate.
- Error UX inconsistent: some screens throw generic errors, some show nothing, some hard-fail.
- Streaming chat can fail silently on network blips; no reconnect/timeout UX.

## Success Criteria (Definition of Done)
- No direct `fetch('/api/...')` calls in FE app code (tests/mocks allowed).
- All FE API calls:
  - Respect `config.apiBaseUrl`.
  - Include auth automatically (token/cookie strategy).
  - Emit consistent error shape for UI handling.
- App shows clear “backend misconfigured/down” UI when `apiBaseUrl` is wrong or backend unavailable.
- Long-running operations show progress + cancel/retry.

## Non-Goals (For This Plan)
- Full redesign of UI visual style.
- Replacing Zustand/React Query.
- Multi-tenant / RBAC redesign.

---

## Phase 0 — Decide Standard (1 decision)
Pick one networking standard:

### Option A (Recommended): Axios-only via `httpClient`
- Pros: already present interceptors; easiest to standardize headers/auth; central timeout/retry; typed responses.
- Cons: streaming (SSE/ReadableStream) still needs `fetch` (Axios not great for web streaming).

### Option B: `fetch` wrapper for everything
- Pros: one primitive; easier for streaming + normal JSON calls.
- Cons: must re-implement interceptors, timeouts, error parsing, auth injection, retries.

Decision rule:
- Use **Axios (`httpClient`) for all JSON APIs**.
- Use **`fetch` only for streaming** (chat SSE), but route it through the same base URL + auth + error parsing helpers.

---

## Phase 1 — Frontend Standardization (Networking)

### 1.1 Create a single request layer
Add a small FE module with:
- `toApiUrl(path: string): string` (single canonical impl; no duplicates).
- `apiErrorFromUnknown(err): ApiError` (normalize Axios/fetch errors).
- `apiFetchStream(...)` for streaming chat only (uses `toApiUrl`, includes auth).

Target location (suggested):
- `src/services/apiClient.ts` (or `src/lib/apiClient.ts`)

### 1.2 Remove direct `fetch('/api/...')` usage
Replace all raw `fetch('/api/...')` usage in feature hooks/services with:
- `httpClient.get/post/...` for JSON endpoints
- or a typed service module (e.g. `src/services/api/observability.ts`)

Concrete hotspots to fix first:
- `src/features/observability/hooks/index.ts` (currently raw `fetch`)
- `src/pages/ObservabilityPage.tsx` (export call)
- Any other `fetch('/api/...')` calls found by search

### 1.3 Standardize error + toast behavior
Define UI rules:
- If request fails with network error / 5xx: show toast “Service unavailable” + retry.
- If 401: clear auth + redirect to `/login` (already in Axios interceptor).
- If validation error: show inline form error (not generic toast).

Implementation notes:
- For React Query: add global `queryClient` defaults (`retry`, `staleTime`) and a shared error handler.
- For non-query actions: standard `try/catch` to map error → toast.

### 1.4 Standardize base URL behavior across dev/prod
Rules:
- Dev with MSW: allow empty `VITE_API_BASE_URL` so `/api/*` stays same-origin.
- Local backend without MSW: set `VITE_API_BASE_URL=http://127.0.0.1:6333` (or whatever backend uses).
- Preview/prod: must set `VITE_API_BASE_URL` to real backend origin.

Deliverable:
- Update `README.md` (frontend) with a clear matrix:
  - “MSW mode” vs “Real backend mode”
  - required `.env` values

---

## Phase 2 — Backend Standardization (Reliability + Contract)

### 2.1 Add readiness endpoint
Add `GET /ready` (or extend `/health`) to check:
- DB reachable (if configured)
- Redis reachable (if configured)
- vector store ready (if applicable)
- (optional) embeddings model loaded

Return:
- `200` when ready
- `503` when not ready, with structured JSON `{ status, checks: {...}, message }`

Why:
- Frontend can show “Backend starting / misconfigured” instead of failing pages.

### 2.2 Consistent error response schema
Standardize backend errors:
- Always return JSON with `{ error: { code, message, details? } }`
- Include `request_id` / correlation id (middleware)

Why:
- FE can display meaningful messages and avoid parsing random formats.

### 2.3 Timeouts + circuit breakers (basic)
For outbound LLM calls:
- request timeout
- bounded retries (only for safe idempotent calls)
- return clear “provider unavailable” error code

---

## Phase 3 — UX Improvements (High Impact, Low Scope)

### 3.1 Global “Service Status” banner
On app boot:
- call `GET {apiBaseUrl}/health` + `GET {apiBaseUrl}/ready`
- if fail/503: show banner with:
  - current `apiBaseUrl`
  - “Retry” button
  - “How to fix” (copyable env var snippet)

### 3.2 Better loading states
Standards:
- Skeletons for lists (conversations, audit log)
- Inline spinner for buttons (“Run evaluation”, “Export”, “Send”)
- Disable actions while request in-flight

### 3.3 Streaming chat resilience
Add:
- “Connecting / Reconnecting…” status
- “Stop generating” (AbortController)
- retry/resume behavior if network blips (at minimum: allow retry last message)

### 3.4 Empty state + error state consistency
Provide one `EmptyState` + one `ErrorState` component pattern:
- title, description, primary action, secondary action
- reused across pages

---

## Implementation Order (Suggested)
1. FE: single request layer + replace raw `fetch('/api/...')` (largest stability gain).
2. FE: global error/toast standards + React Query defaults.
3. BE: `/ready` + structured error schema.
4. FE: service status banner (uses `/ready`).
5. FE: streaming chat abort + reconnect UX.

---

## Testing / Verification
- FE unit tests:
  - `toApiUrl()` behavior (base url present/absent)
  - error normalization for Axios vs fetch
- FE integration smoke:
  - run in MSW mode (no base URL) — all pages still work.
  - run against real backend (base URL set) — no requests go to wrong origin.
- BE:
  - `/health` always `200`
  - `/ready` returns `503` when deps unavailable

---

## Notes / Risks
- Vercel rewrites in `vercel.json` do **not** proxy to an external backend by default; production must set `VITE_API_BASE_URL` to backend origin (or add a real proxy layer).
- Streaming stays on `fetch` but must still use `toApiUrl()` and shared auth/error helpers.
