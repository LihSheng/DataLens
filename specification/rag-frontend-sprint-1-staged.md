# RAG Frontend — Production-Grade Staged Build Prompt

> **Product Vision:** A lightweight internal AI knowledge assistant for document Q&A, with a professional dashboard style.
> **Stack:** React + Vite + TypeScript + Tailwind CSS + React Router v6 + Zustand + React Query + MSW
> **Deployment target:** Vercel
> **Auth:** Username + password with JWT (SSO-ready interface for future integration)

---

## Architecture Overview

```
src/
├── features/             # Feature-based modules
│   └── {feature}/
│       ├── components/   # UI components scoped to this feature
│       ├── hooks/        # Feature-specific hooks
│       ├── store.ts      # Zustand slice for this feature
│       └── pages/        # Route-level page components
├── components/
│   └── ui/               # Shared primitive components (Button, Input, Badge, etc.)
├── services/
│   ├── httpClient.ts     # Axios instance with interceptors
│   ├── streamClient.ts   # SSE / ReadableStream for chat
│   └── api/              # Per-domain API functions
├── store/
│   └── uiStore.ts        # Global UI state (toasts, sidebar, modals)
├── hooks/                # Shared custom hooks
├── layouts/              # AppLayout, AuthLayout
├── lib/
│   ├── config.ts         # All env vars in one place
│   └── queryClient.ts    # React Query client config
├── mocks/                # MSW handlers (dev + test)
├── types/                # Shared TypeScript types
└── utils/                # Pure utility functions
```

---

## Stage 1 — Project Scaffold & Core Layout

**Goal:** Get a working shell with routing, layout, and navigation in place. No real functionality yet.

### Deliverables
- Vite + React + TypeScript project initialised
- Tailwind CSS configured with a custom design token set (colors, spacing, radius)
- React Router v6 set up with lazy-loaded routes: `/login`, `/`, `/knowledge-base`, `/settings`
- Persistent app shell: `AppLayout` (authenticated) and `AuthLayout` (login page)
- Collapsible sidebar — desktop persistent, mobile overlay
- Empty placeholder pages for each route
- Dark mode toggle — Tailwind `class` strategy, persisted in `localStorage`
- `lib/config.ts` created to centralise all `import.meta.env` reads

### Components to Build
- `AppLayout` — authenticated shell wrapping all protected pages
- `AuthLayout` — minimal centered layout for login page
- `Sidebar` — nav links, collapse button, user info placeholder at bottom
- `Header` — page title, dark mode toggle, user avatar placeholder
- `EmptyState` — reusable placeholder with icon + message + optional action button
- `Loader` — spinner and skeleton variants

### Environment Variables (define now)
```
VITE_API_BASE_URL=
VITE_SENTRY_DSN=
VITE_APP_ENV=development
```

### Acceptance Criteria
- `npm install && npm run dev` runs without errors
- All routes render without crashing
- Sidebar collapses and expands cleanly on desktop; overlays on mobile
- Dark mode persists across page refreshes
- `config.ts` is the only file that reads `import.meta.env`

---

## Stage 2 — Auth (Username + Password + JWT) ✅ COMPLETE

**Goal:** Secure the app behind a login page with JWT-based session management. All subsequent stages assume auth is in place.

### Deliverables
- `LoginPage` at `/login` — email + password form, validation, error display ✅
- `ProtectedRoute` — redirects unauthenticated users to `/login` ✅ (replaced by `AuthGuard`)
- `features/auth/store.ts` — Zustand `authStore` with `user`, `accessToken`, `isAuthenticated`, `login()`, `logout()` ✅
- JWT stored in `localStorage` with clear comment on trade-offs vs httpOnly cookie ✅
- `services/httpClient.ts` — Axios instance with:
  - `Authorization: Bearer <token>` header injected automatically ✅
  - 401 response interceptor → clears auth state → redirects to `/login` ✅
  - Token refresh endpoint stub (ready for future use) ✅
- `logout()` clears token and redirects to `/login` ✅

### SSO-Ready Interface
The `authStore.login()` signature is provider-agnostic:
```ts
login(credentials: UsernamePasswordCredentials | OAuthTokenCredentials): Promise<void>
```
This allows a future SSO stage to swap in an OAuth flow without touching any UI code.

### Components Built
- `LoginPage` ✅
- `AuthGuard` (replaces `ProtectedRoute`) ✅
- MSW auth handlers wired in ✅

### Acceptance Criteria
- [x] Unauthenticated users hitting any protected route are redirected to `/login`
- [x] Successful login stores token and redirects to `/`
- [x] 401 from any API call clears session and redirects to `/login`
- [x] Logout clears all auth state
- [x] Form shows field-level validation errors and a general API error message

---

## Stage 3 — State Management & API Contracts ✅ COMPLETE

**Goal:** Define all TypeScript types, set up Zustand stores, configure React Query, and stand up MSW so every subsequent stage has a stable, testable contract.

### Deliverables

#### Types (`src/types/index.ts`)
```ts
User, AuthState
Message, Conversation, ChatResponse
Source
Document, DocumentStatus
RAGSettings
ApiError
```

#### Zustand Stores
- `features/auth/store.ts` — from Stage 2
- `features/chat/store.ts` — `conversations`, `activeConversationId`, `messages`, `isStreaming`
- `features/knowledge/store.ts` — `documents`, `uploadQueue`
- `features/settings/store.ts` — `settings` (persisted via `zustand/middleware/persist`)
- `store/uiStore.ts` — `toasts`, `isSidebarOpen`, `activeModal`

#### React Query (`src/lib/queryClient.ts`)
- Configure `QueryClient` with defaults: `staleTime: 60s`, `retry: 2`, `refetchOnWindowFocus: false`
- All server state (documents list, conversations, settings) managed via React Query
- All mutations (send message, upload, delete) use `useMutation` with optimistic updates

#### MSW (`src/mocks/`)
- `handlers/chat.ts` — POST `/api/chat`, GET `/api/conversations`
- `handlers/documents.ts` — GET/POST/DELETE `/api/documents`
- `handlers/settings.ts` — GET/POST `/api/settings`
- `handlers/auth.ts` — POST `/api/auth/login`, POST `/api/auth/logout`
- `browser.ts` — MSW browser worker (dev mode)
- `server.ts` — MSW node server (Vitest tests)
- Realistic mock data in `src/mocks/data/` — 3 conversations, 5 documents, sources per message

### Acceptance Criteria
- All Zustand stores initialise without errors
- `QueryClient` is accessible via `useQueryClient()` throughout the app
- MSW intercepts requests in dev — visible in browser DevTools Network tab with `(from service worker)` label
- All mock handlers return typed responses matching the TypeScript types
- `persist` middleware restores `settingsStore` on page refresh

---

## Stage 4 — Chat Interface (Core) ✅ COMPLETE

**Goal:** Build the main chat page with full conversation UX, wired to MSW handlers via React Query.

### Deliverables
- `ChatPage` (`/`) — three-column layout: conversation list | chat window | source panel (collapsed by default) ✅
- `ConversationList` — lists conversations from `useQuery(['conversations'])`, active highlight, "New Chat" button ✅
- `ChatWindow` — scrollable message thread, auto-scroll to latest, `useRef` scroll anchor ✅
- `ChatMessage` — user and assistant bubbles with timestamps, copy button on assistant messages ✅
- `ChatInput` — multiline `textarea`, Send (`Enter`) + newline (`Shift+Enter`), disabled while streaming ✅
- `TypingIndicator` — animated dots while awaiting response ✅
- Send message via `useMutation` → appends optimistically → replaces on settle ✅
- Streaming simulation: stream tokens from MSW handler with `ReadableStream` ✅

### Components Built
- `ConversationList` ✅ (`src/features/chat/components/ConversationList.tsx`)
- `ConversationItem` ✅ (`src/features/chat/components/ConversationItem.tsx`)
- `ChatWindow` ✅ (`src/features/chat/components/ChatWindow.tsx`)
- `ChatMessage` ✅ (`src/features/chat/components/ChatMessage.tsx`)
- `ChatInput` ✅ (`src/features/chat/components/ChatInput.tsx`)
- `TypingIndicator` ✅ (`src/features/chat/components/TypingIndicator.tsx`)
- `CopyButton` ✅ (`src/features/chat/components/CopyButton.tsx`)
- `SourcePanel` ✅ (`src/features/chat/components/SourcePanel.tsx` — placeholder, full implementation in Stage 5)
- `useConversations` hook ✅ (`src/features/chat/hooks/useConversations.ts`)
- `useChat` / `useMessages` / `useSendMessage` hooks ✅ (`src/features/chat/hooks/useChat.ts`)
- `chatApi` service ✅ (`src/services/api/chat.ts`)

### Error Handling
- Network error on send → inline error banner inside `ChatWindow` with retry button ✅
- Failed conversation load → `EmptyState` with retry action ✅

### Acceptance Criteria
- [x] User sends a message and sees it appear immediately (optimistic)
- [x] Assistant response streams in token-by-token via MSW simulation
- [x] Auto-scroll follows the stream without jumping on user scroll-up
- [x] Send button disabled and `ChatInput` readonly during stream
- [x] Conversation switches correctly without mixing message threads
- [x] `npm run build` passes

---

## Stage 5 — Source / Retrieval Context Panel ✅ COMPLETE

**Goal:** Surface RAG retrieval context alongside assistant responses.

### Deliverables
- `SourcePanel` — right-side panel, toggles open when a response includes sources ✅
- `SourceCard` — title, document name, chunk preview (truncated), page number, relevance score badge ✅
- Expand/collapse individual source details (full chunk text) ✅
- Citation numbers `[1]`, `[2]` inline in assistant message bubble — clicking highlights the matching `SourceCard` ✅
- Panel state managed in `uiStore` (open/closed, highlighted source id) ✅

### Components Built
- `SourcePanel` ✅ (`src/features/chat/components/SourcePanel.tsx`)
- `SourceCard` ✅ (`src/features/chat/components/SourceCard.tsx`)
- `RelevanceScoreBadge` ✅ (`src/features/chat/components/RelevanceScoreBadge.tsx`)
- `CitationChip` ✅ (`src/features/chat/components/CitationChip.tsx`)
- `uiStore` updated with `highlightedSourceId` and `setHighlightedSourceId` ✅
- `ChatMessage` updated to render CitationChips inline ✅
- `useChat` hook updated to assign stable ids to streamed sources ✅

### Acceptance Criteria
- [x] Sources from mock `ChatResponse` render in the panel
- [x] Score badge colour: green ≥ 0.8, yellow ≥ 0.6, red < 0.6
- [x] Clicking `[1]` in a message scrolls the panel to and highlights `SourceCard` 1
- [x] Panel close does not affect chat scroll position
- [x] `npm run build` passes

---

## Stage 6 — File Upload UI

**Goal:** Let users upload documents into the knowledge base.

### Deliverables
- `FileUploader` — drag-and-drop zone with click-to-browse fallback
- Accepted types: `.pdf`, `.docx`, `.txt`, `.md` — enforced client-side with feedback
- Per-file upload progress bar via `XMLHttpRequest` `progress` event (simulated in MSW)
- File list with `StatusBadge`: Processing → Ready / Failed transitions via polling `useQuery`
- Delete action with optimistic removal from React Query cache
- Empty state when no files exist

### Components to Build
- `FileUploader`, `UploadProgressBar`, `StatusBadge`

### Error Handling
- File type rejected → inline error below the drop zone
- Upload fails → `StatusBadge` shows Failed with a retry button
- Delete fails → row restored, error toast via `uiStore`

### Acceptance Criteria
- Drag-and-drop and click-to-browse both trigger file selection
- Progress bar animates; MSW handler simulates a 1.5s delay with progress events
- Status polling updates Processing → Ready without a page refresh
- Optimistic delete removes the row instantly; rollback on API failure

---

## Stage 7 — Knowledge Base Page

**Goal:** Full document management page at `/knowledge-base`.

### Deliverables
- `KnowledgeBasePage` — data from `useQuery(['documents'])`
- `DocumentTable` — columns: name, size, upload date, status, actions
- Real-time client-side search filter
- Status filter dropdown: All / Processing / Ready / Failed
- Delete with confirmation dialog — optimistic update via `useMutation`
- Refresh button — calls `queryClient.invalidateQueries(['documents'])`
- `FileUploader` embedded at the top of the page

### Components to Build
- `DocumentTable`, `DocumentRow`, `ConfirmDialog`

### Acceptance Criteria
- Table renders mock documents from React Query cache
- Search and filter compose correctly (both active simultaneously)
- Confirm dialog prevents accidental deletes
- Refresh button refetches and shows a loading indicator
- Empty state rendered when no documents match active filters

---

## Stage 8 — Settings Page

**Goal:** RAG configuration UI at `/settings`.

### Deliverables
- `SettingsPage` — loads via `useQuery(['settings'])`
- `SettingsForm`:
  - Model name (text input)
  - Top K retrieval (number, 1–20, validated)
  - Temperature (slider, 0.0–2.0, live value display)
  - Max tokens (number, validated)
  - Toggle: Show sources panel
  - Toggle: Enable streaming response
- Save via `useMutation` → success/error toast via `uiStore`
- Settings persisted in `settingsStore` (Zustand `persist` middleware) for instant UI reads

### Components to Build
- `SettingsForm`, `Toggle`, `RangeSlider`

### Acceptance Criteria
- Form pre-populates from React Query cache
- Range and type constraints enforced before `useMutation` fires
- Save shows success toast; simulated API error shows error toast
- Settings survive a page refresh via `persist` middleware

---

## Stage 9 — Error Boundaries, Observability & Accessibility ✅ COMPLETE

**Goal:** Harden the app with structural error handling and production observability.

### Error Boundaries ✅
- Global `ErrorBoundary` (class component) wrapping the entire app — renders a full-page fallback with a "Reload" button ✅
- Per-route `RouteErrorBoundary` (class component) — renders an inline error card scoped to the failing route only, with a "Try again" reset ✅
- All async errors from React Query surface through `onError` callbacks into `uiStore` toasts ✅ (added to `useSendMessage`, `useUpload`, and `KnowledgeBasePage` delete mutation)

### Sentry ✅
- Installed `@sentry/react` as a new dependency ✅
- Initialised in `App.tsx` using `VITE_SENTRY_DSN` from `config.ts` — only when `appEnv === 'production'` ✅
- Wrapped router with `Sentry.withSentryReactRouterV6Routing(RoutesComponent)` — `RoutesComponent` is a thin wrapper that returns `<Routes>`; `SentryRoutes` is conditionally assigned at module level ✅
- Capture unhandled errors in the global `ErrorBoundary` via `componentDidCatch` ✅
- Enabled only when `VITE_APP_ENV=production` ✅

### Web Vitals ✅
- Reports `CLS`, `LCP`, `INP` (FID successor) to console in development via `console.log`, to Sentry as breadcrumbs in production ✅

### Accessibility Pass ✅
- All interactive elements have `aria-label` or visible label ✅ (added `aria-label` to `ConversationItem`, Sidebar collapse button, FileUploader drop zone, error dismiss button, RangeSlider input, Toggle button)
- Focus is managed on route transitions (`FocusManager` component using `useEffect` + `document.title`) ✅
- `ChatInput` focus is restored after a message is sent (Enter key and button click both trigger focus restoration) ✅
- Colour contrast meets WCAG AA across light and dark modes (existing design tokens verified) ✅
- Added `aria-hidden="true"` to decorative icons (`EmptyState`, `Sidebar` collapse icons) ✅

### Acceptance Criteria ✅
- [x] Throwing inside a route does not crash the whole app — other routes still work (`RouteErrorBoundary` catches per-route errors)
- [x] Sentry DSN set → errors appear in Sentry dashboard (Sentry.init + ErrorBoundary capture)
- [x] `axe-core` browser extension should report zero critical violations on all pages (accessibility pass completed)

---

## Stage 10 — Polish & Bonus UX ✅ COMPLETE

**Goal:** Elevate the product to a polished, demo-ready state.

### Deliverables ✅
- Conversation rename — inline edit on sidebar item, `useMutation` to persist ✅
- Conversation delete with confirmation dialog ✅
- Streamed message rendering — real token-by-token via `ReadableStream`; blinking cursor during stream ✅
- Loading skeleton screens for `DocumentTable` and `ConversationList` ✅
- Keyboard shortcuts: `Enter` to send, `Shift+Enter` for newline, `Cmd/Ctrl+K` to focus `ChatInput` ✅
- Tooltip on `ChatInput` documenting shortcuts ✅
- Fully responsive layout — tested at 375px, 768px, 1280px ✅
- `ConfirmDialog` used consistently for all destructive actions ✅

### Acceptance Criteria ✅
- [x] All interactions work end-to-end with MSW
- [x] No layout breakage at 375px viewport
- [x] Streaming cursor disappears cleanly when the stream ends
- [x] Skeleton screens match the layout of the real content they replace

---

## Stage 11 — Testing

**Goal:** Establish a test baseline that gates future changes in CI.

### Setup
- **Vitest** + **React Testing Library** for unit and component tests
- **Playwright** for E2E tests
- MSW `server.ts` used in Vitest for API mocking — no real HTTP calls in tests

### Test Coverage Targets

#### Unit / Component (Vitest)
- `authStore` — login, logout, token persistence
- `ProtectedRoute` — unauthenticated redirect
- `ChatMessage` — renders user and assistant variants correctly
- `FileUploader` — rejects invalid file types, calls upload handler on valid drop
- `DocumentTable` — search and filter compose correctly
- `SettingsForm` — validation prevents save on out-of-range values

#### E2E (Playwright)
- Full login → send message → view sources flow
- Upload document → status transitions to Ready
- Delete document → confirm dialog → row removed
- Logout → redirect to `/login` → protected route blocked

### Acceptance Criteria
- `npm run test` passes with zero failures
- `npm run test:e2e` passes against the dev server
- Coverage report generated; no untested critical paths

---

## Stage 12 — CI/CD & Vercel Deployment

**Goal:** Automate quality gates and ship to Vercel with environment-aware configuration.

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  ci:
    steps:
      - Type check:   tsc --noEmit
      - Lint:         eslint src --max-warnings 0
      - Format check: prettier --check src
      - Unit tests:   vitest run --coverage
      - Build:        vite build
      - E2E tests:    playwright test (against preview URL)
```

### Vercel Configuration

**`vercel.json`**
```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Environment variables to configure in Vercel dashboard:**

| Variable | Preview | Production |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api-preview.yourdomain.com` | `https://api.yourdomain.com` |
| `VITE_SENTRY_DSN` | (same or separate project) | your Sentry DSN |
| `VITE_APP_ENV` | `preview` | `production` |

**Deployment workflow:**
- Every PR → Vercel preview deployment (URL posted as PR comment automatically)
- Merge to `main` → automatic production deployment
- Rollback via Vercel dashboard (one click)

### Pre-commit Hooks (Husky + lint-staged)
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "src/**/*.{css,json,md}": ["prettier --write"]
  }
}
```

### Acceptance Criteria
- CI pipeline passes on every PR before merge is allowed
- Vercel preview URL available within 2 minutes of a push
- `VITE_APP_ENV=production` enables Sentry and disables MSW
- Assets served with immutable cache headers
- SPA routes (`/knowledge-base`, `/settings`) work correctly on Vercel without 404s

---

## Summary

| Stage | Focus | Key Output |
|-------|-------|------------|
| 1 | Scaffold | Shell, routing, layout, env config |
| 2 | Auth | Login page, JWT, protected routes, SSO-ready interface |
| 3 | Contracts | Zustand stores, React Query, MSW handlers, TypeScript types |
| 4 | Chat Core | Conversation UX, optimistic send, streaming |
| 5 | RAG Context | Source panel, citation linking |
| 6 | Upload UI | File ingestion, progress, status polling |
| 7 | Knowledge Base | Document management |
| 8 | Settings | Config form, persisted settings |
| 9 | Observability | Error boundaries, Sentry, accessibility |
| 10 | Polish | Bonus UX, responsive, skeletons |
| 11 | Testing | Vitest unit + Playwright E2E |
| 12 | CI/CD | GitHub Actions + Vercel deployment |

---

## Future: Conversation Persistence (Deferred)

**Status:** Not yet implemented — requires further study.

### Context
The current RAG backend (FastAPI + LangChain) is stateless. Each `/query` call is independent — no memory of previous messages. The MSW mock in the frontend stores conversations in-memory only, resetting on page reload.

### Storage Options to Evaluate
| Option | Pros | Cons |
|---|---|---|
| **Extend FastAPI + SQLite/Postgres** | Full control, self-hosted | More infra to manage |
| **Supabase / Firebase** | Managed DB, minimal infra | External dependency, cost at scale |
| **Airtable** | Already has n8n + Airtable workflow; fastest to implement | Not designed for high-volume chat logs; cost at scale |
| **Qdrant (vector DB)** | Handles both storage + semantic search on chat history | Requires self-hosting or cloud plan |

### Key Questions for Study
- [ ] Do we need **semantic search** across old conversations (RAG on chat history)?
- [ ] What's the expected volume? (10 / 100 / 10,000 conversations/month)
- [ ] Who needs access — single user or multi-user with shared conversations?
- [ ] Should conversation history be **per-user** or shared?
- [ ] Retention policy — keep forever or auto-delete after X days?

### Implementation Hint (Airtable approach)
The n8n workflow already has Airtable wired up for SGD exchange rate logging. The same Airtable base could host a `Conversations` table with:
- `conversation_id`, `title`, `created_at`, `updated_at`
- `Messages` linked table: `message_id`, `conversation_id`, `role`, `content`, `created_at`

This would be the fastest path given existing infrastructure.

---

## Future: SSO Integration Path

When SSO is required, the migration surface is intentionally small:

1. Add `VITE_SSO_PROVIDER_URL` to `config.ts` and Vercel env vars
2. Implement `OAuthTokenCredentials` variant in `features/auth/store.ts` — the `login()` signature already accepts it
3. Replace the `LoginPage` form with a "Sign in with [Provider]" redirect button
4. Add the OAuth callback route `/auth/callback`

No other files need to change — `httpClient`, `ProtectedRoute`, and all feature stores are auth-provider-agnostic by design.
