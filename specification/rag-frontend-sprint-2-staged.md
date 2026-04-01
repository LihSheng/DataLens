# RAG Frontend — Sprint 2 Staged Build Prompt

> **Purpose:** Implement the **frontend-only gap-filling features** from `RAG-TODO.md`, using the same staged format and level of detail as `rag-frontend-staged.md`.
> **Scope:** UI, state, routes, components, API contracts, optimistic behavior, and admin-facing visibility only.
> **Out of scope:** Python/FastAPI/LangChain implementation details beyond the request/response contracts the frontend depends on.
>
> **Stack:** React + Vite + TypeScript + Tailwind CSS + React Router v6 + Zustand + React Query + MSW
> **Baseline:** Assumes Stage 1–12 in `rag-frontend-staged.md` are already available.

---

## Sprint 2 Goal

Close the most important **product-level UX gaps** still missing from the frontend, especially in these areas:

- Retrieval controls exposed to users
- Better ingestion/document-management visibility
- Stronger answer trust signals
- Multi-turn conversation UX
- Performance/cost visibility in chat
- Feedback collection and observability foundations

This sprint is intentionally **frontend-first**: every stage should be buildable with mock contracts in MSW even before the backend is fully ready.

---

## Assumptions

- Existing chat, source panel, auth, RBAC, settings, knowledge base, and observability shell already exist.
- `SettingsPage` and `ObservabilityPage` can be extended without structural rewrites.
- `DocumentTable`, `ChatMessage`, `ChatInput`, and `SourcePanel` already exist and should be enhanced rather than replaced.
- New API fields introduced in this sprint should be mocked in MSW first.

---

## New / Extended Types

Extend the shared TypeScript model layer before implementing any UI.

```ts
export type ChunkingStrategy = 'semantic' | 'recursive' | 'fixed'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type FeedbackRating = 'positive' | 'negative'

export interface ChatFilters {
  document_ids?: string[]
  doc_type?: string
}

export interface CitationValidity {
  citation: string
  valid: boolean
}

export interface GroundingInfo {
  unsupported_count: number
  fully_grounded: boolean
  unsupported_sentences?: string[]
}

export interface TokenUsage {
  used: number
  available: number
  chunksIncluded: number
  chunksAvailable: number
}

export interface MessageFeedback {
  messageId: string
  conversationId: string
  traceId: string
  rating: FeedbackRating
  comment?: string
  createdAt: string
}

export interface DocumentVersion {
  id: string
  version: number
  uploadedAt: string
  status: 'processing' | 'ready' | 'failed'
  isActive: boolean
}

export interface DocumentRecord {
  id: string
  name: string
  size: number
  uploadedAt: string
  status: 'processing' | 'ready' | 'failed'
  extension: string
  parseError?: string
  ocrApplied?: boolean
  piiEntitiesFound?: string[]
  version?: number
  restricted?: boolean
  queuePosition?: number
}

export interface RAGSettings {
  model: string
  topK: number
  temperature: number
  maxTokens: number
  showSourcesPanel: boolean
  enableStreaming: boolean

  hybridWeightDense: number
  rerankerEnabled: boolean
  queryExpansionEnabled: boolean
  hydeEnabled: boolean
  chunkingStrategy: ChunkingStrategy
  piiRedactionEnabled: boolean
  confidenceThreshold: number
  modelRoutingEnabled: boolean
  memoryWindow: number
  conversationRetentionDays: number
}

export interface ChatResponse {
  answer: string
  sources: Source[]
  confidence?: ConfidenceLevel
  noAnswerReason?: string
  cacheHit?: boolean
  routedToModel?: string
  rerankScoreAvailable?: boolean
  grounding?: GroundingInfo
  citationValidity?: CitationValidity[]
  suggestedFollowups?: string[]
  tokenUsage?: TokenUsage
}
```

---

## Stage S2.1 — Retrieval Controls in Settings + Chat Scope ✅ DONE

> **Completed:** 2026-04-01

**Goal:** Expose the most important retrieval knobs in the UI and allow the user to narrow search scope directly from chat.

### Deliverables
- Extend `SettingsForm` with the following controls:
  - `Retrieval balance` slider (`hybridWeightDense`, 0.0 → 1.0, step 0.1)
  - `Enable reranking` toggle (`rerankerEnabled`)
  - `Query expansion (multi-query)` toggle (`queryExpansionEnabled`)
  - `HyDE retrieval` toggle (`hydeEnabled`)
  - `Chunking strategy` dropdown (`semantic`, `recursive`, `fixed`)
  - `Confidence threshold` slider (`confidenceThreshold`, 0.0 → 1.0)
- Add helper text / tooltip copy for latency-sensitive options:
  - Query expansion
n  - HyDE
  - Reranking
- Add collapsible `SearchScopePicker` above `ChatInput`
  - Default state: collapsed
  - Supports `All documents` or selected document subset
- Selected scope is passed in `POST /api/chat` request body as `filters.document_ids`
- Show active scope chips above the input when retrieval is narrowed

### Components to Build
- `SettingsSection`
- `HelpTooltip`
- `SelectField`
- `SearchScopePicker`
- `FilterChipGroup`

### Hooks / State
- Extend `settingsStore` for all new retrieval-related settings
- Extend `chatStore` with transient `activeFilters`
- Add `useDocumentScope()` hook for selected document ids + chip display text

### API / MSW Contracts
- `GET /api/settings` and `POST /api/settings` include new retrieval settings fields
- `POST /api/chat` accepts:

```ts
{
  conversation_id: string
  message: string
  filters?: {
    document_ids?: string[]
  }
}
```

### Acceptance Criteria
- Settings render with valid defaults and save successfully through React Query mutation
- Scope picker loads uploaded documents from query cache
- User can select multiple documents and see chips before sending
- Sending a message includes `filters.document_ids` only when scope is narrowed
- Settings controls have validation and accessible labels

---

## Stage S2.2 — Ingestion UX Enhancements on Knowledge Base ✅ DONE

> **Completed:** 2026-04-01

**Goal:** Make document ingestion feel production-ready by exposing richer parsing and processing states.

### Deliverables
- Extend `DocumentTable` with:
  - file type icon by extension
  - OCR badge when `ocrApplied === true`
  - PII badge when `piiEntitiesFound?.length > 0`
  - version badge `v2`, `v3`, etc.
  - lock icon when `restricted === true`
- Extend `StatusBadge` behavior:
  - show `parseError` tooltip for failed parsing
  - show queue text when `queuePosition` is present
  - stop polling once `ready` or `failed`
- Add `Re-index` action button per document row
- Add `Version history` action button per document row
- Show chunking mismatch banner when current settings differ from indexed strategy:
  - `Existing documents use a different strategy. Re-index to apply.`

### Components to Build
- `DocumentTypeIcon`
- `InfoBadge`
- `VersionBadge`
- `QueueHint`
- `VersionHistoryDrawer`
- `DocumentActionMenu`
- `ReindexBanner`

### Hooks / State
- `useDocumentVersions(documentId)`
- `useReindexDocument()` mutation
- `usePollingDocumentStatus()` refactor for queue-aware polling

### API / MSW Contracts
- `GET /api/documents` returns extended fields from `DocumentRecord`
- `GET /api/documents/:id/versions` returns `DocumentVersion[]`
- `POST /api/documents/:id/reindex` triggers reindex state

### Acceptance Criteria
- Table rows show correct badges and icons from mock data
- Failed documents surface parse error detail without opening a modal
- Version history opens in a side drawer and shows active version clearly
- Re-index action updates row state optimistically to `processing`
- Queue position text appears only while processing

---

## Stage S2.3 — Multi-Turn Memory + Follow-Up UX ✅ DONE

**Goal:** Make conversations feel continuous and guide the next user action after each answer.

### Deliverables
- Add `Memory window` numeric field to `SettingsForm` (1–20)
- Add `Memory active` indicator in the chat input area when conversation contains history
- Render AI-generated follow-up suggestion pills below assistant responses
- Clicking a suggestion:
  - prefills `ChatInput`
  - optionally auto-sends immediately
- Follow-up pills hide when the user starts typing a different message
- Delayed reveal animation after stream completion

### Components to Build
- `MemoryIndicator`
- `FollowupSuggestionList`
- `FollowupSuggestionPill`

### Hooks / State
- Extend `settingsStore` with `memoryWindow`
- Extend `chatStore` with:
  - `draftMessage`
  - `visibleFollowupMessageId`
- Add `useFollowupSuggestions(messageId)` helper

### API / MSW Contracts
- `ChatResponse` may include:

```ts
{
  suggestedFollowups?: string[]
}
```

### Acceptance Criteria
- Memory indicator only appears when there is prior chat history in the active conversation
- Follow-up pills render only for assistant messages that include them
- Clicking a pill populates the input correctly and preserves keyboard flow
- Suggestions disappear once the user starts composing a different prompt

---

## Stage S2.4 — Answer Trust Signals ✅ DONE

**Goal:** Give users clearer signals about answer quality, support, and fallback states without making the UI noisy.

### Deliverables
- Extend `ChatMessage` meta row with:
  - confidence pill (`high`, `medium`, `low`)
  - cached pill when `cacheHit === true`
  - routed model label when `routedToModel` exists
- Add grounding indicator:
  - green shield for fully grounded
  - yellow shield for partially unverified
- Invalid citations render in warning styling
- Add no-answer visual state for low-confidence fallback messages
- Extend `SourceCard` / `RelevanceScoreBadge`:
  - prefer `rerankScore` when available
  - label score type as `Rerank score` vs `Similarity score`

### Components to Build
- `ConfidencePill`
- `GroundingIndicator`
- `CitationWarningTooltip`
- `NoAnswerState`
- `ModelBadge`
- `CachePill`

### Hooks / State
- Add message-level helpers:
  - `getConfidenceTone()`
  - `getGroundingTone()`
  - `isInvalidCitation(citationNumber)`

### API / MSW Contracts
- `ChatResponse` / `Message` payloads may include:

```ts
{
  confidence?: 'high' | 'medium' | 'low'
  noAnswerReason?: string
  cacheHit?: boolean
  routedToModel?: string
  grounding?: {
    unsupported_count: number
    fully_grounded: boolean
    unsupported_sentences?: string[]
  }
  citationValidity?: Array<{ citation: string; valid: boolean }>
}
```

### Acceptance Criteria
- Confidence and grounding status are readable in both light and dark themes
- No-answer fallback has a distinct visual treatment from normal assistant answers
- Invalid citations are visibly different and provide hover/focus explanation
- Message meta row remains compact on mobile

---

## Stage S2.5 — Token / Context Visibility in Source Panel ✅ DONE

**Goal:** Help power users understand how much context was actually used without turning the product into a debug console.

### Deliverables
- Add `SourcePanelFooter` with token usage summary:
  - `Context used: 1,842 / 3,000 tokens`
  - `3 of 5 chunks included`
- Add subtle progress bar for context usage
- Add label when chunks were dropped due to token budget
- Keep footer hidden when token usage is absent

### Components to Build
- `SourcePanelFooter`
- `TokenUsageBar`
- `ContextUsageSummary`

### API / MSW Contracts
- `ChatResponse` may include:

```ts
{
  tokenUsage?: {
    used: number
    available: number
    chunksIncluded: number
    chunksAvailable: number
  }
}
```

### Acceptance Criteria
- Footer does not render for legacy messages without token data
- Progress bar and counts update with the selected assistant message
- Layout does not shift when opening and closing the source panel

---

## Stage S2.6 — Message Feedback Loop

**Goal:** Capture explicit user feedback on answer quality and prepare data for later observability views.

### Deliverables
- Add thumbs up / thumbs down controls on assistant messages
- One feedback choice per message
- On thumbs down, reveal optional comment textarea (max 200 chars)
- Submit feedback optimistically and show thank-you state after success
- Prevent double submission for the same message

### Components to Build
- `FeedbackButtons`
- `NegativeFeedbackForm`
- `FeedbackSubmittedState`

### Hooks / State
- Extend `chatStore` with local feedback submission state keyed by `messageId`
- Add `useSubmitFeedback()` mutation

### API / MSW Contracts
- `POST /api/feedback`

```ts
{
  messageId: string
  conversationId: string
  traceId: string
  rating: 'positive' | 'negative'
  comment?: string
}
```

### Acceptance Criteria
- Feedback controls only appear on assistant messages
- Downvote path reveals comment box inline without layout breakage
- Submitted messages show stable disabled state on refresh when returned by API
- Mutation failure restores the UI to editable state and shows a toast

---

## Stage S2.7 — Conversation Search + Export / Share

**Goal:** Improve conversation usability beyond the current single-session chat flow.

### Deliverables
- Add sidebar search affordance at the top of `ConversationList`
- Search expands inline and shows matching conversation results with snippets
- Clicking a result:
  - navigates to that conversation
  - scrolls to the matching message if message id is available
- Add conversation export/share actions in chat header:
  - download as Markdown
  - download as PDF
  - copy shareable link
- Add read-only public share page `/share/:token`

### Components to Build
- `ConversationSearchInput`
- `ConversationSearchResults`
- `ConversationHeaderActions`
- `ExportMenu`
- `ShareLinkButton`
- `SharedConversationPage`

### Hooks / State
- `useConversationSearch(query)`
- `useExportConversation()`
- `useCreateShareLink()`

### API / MSW Contracts
- `GET /api/conversations/search?q=`
- `GET /api/conversations/:id/export?format=md|pdf`
- `POST /api/conversations/:id/share`
- `GET /api/share/:token`

### Acceptance Criteria
- Search results debounce and render inline without replacing the normal conversation list permanently
- Export actions trigger file download behavior cleanly
- Share link copy action shows success toast
- Shared page is visibly read-only and hides all editing controls

---

## Stage S2.8 — Admin Observability Additions

**Goal:** Extend the existing observability/admin experience with the most useful frontend surfaces required by the TODO file.

### Deliverables
- Extend `ObservabilityPage` with tabs / sections for:
  - `Evaluation`
  - `Feedback`
  - `Cost`
  - `Audit Log`
- `Evaluation` section:
  - golden dataset table
  - run evaluation button
  - per-question pass/fail badge
- `Feedback` section:
  - positive vs negative ratio cards
  - trend chart placeholder
- `Cost` section:
  - total spend cards
  - cost by model / user tables or charts
- `Audit Log` section:
  - event table with filters: user, type, date range
  - export CSV button
- Respect RBAC / admin-only visibility for all admin sections

### Components to Build
- `ObservabilityTabs`
- `GoldenDatasetTable`
- `RunEvaluationButton`
- `FeedbackStatsCard`
- `CostSummaryCards`
- `AuditTable`
- `AuditFilters`

### Hooks / State
- `useEvaluationRuns()`
- `useFeedbackStats()`
- `useCostSummary()`
- `useAuditLog(filters)`

### API / MSW Contracts
- `GET /api/evaluations/:trace_id`
- `GET /api/feedback/stats`
- `GET /api/costs/summary`
- `GET /api/audit`
- `GET /api/audit/export?format=csv`

### Acceptance Criteria
- Non-admin users never see these tabs or routes
- Tables and cards handle empty/loading/error states cleanly
- Filters sync to URL search params for reload persistence where practical
- Audit table is paginated and performs well with large mock datasets

---

## Stage S2.9 — Admin Document Governance UI

**Goal:** Surface governance features that directly affect frontend document management.

### Deliverables
- Add document-level access control panel in document detail / drawer
- Support access modes:
  - All users
  - Specific roles
  - Specific users
- Add retention settings field to `SettingsForm`:
  - `conversationRetentionDays`
- Add user-facing `Request data erasure` action in user profile / settings area

### Components to Build
- `DocumentAccessControlPanel`
- `PrincipalMultiSelect`
- `RetentionField`
- `DataErasureButton`

### Hooks / State
- `useDocumentAcl(documentId)`
- `useUpdateDocumentAcl()`
- `useRequestDataErasure()`

### API / MSW Contracts
- `PUT /api/documents/:id/acl`
- `DELETE /api/users/:id/data`

### Acceptance Criteria
- ACL panel is admin-only and hidden from standard users
- Restricted documents show consistent lock styling across list and detail views
- Data-erasure request path has confirmation UI and clear destructive messaging

---

## Stage S2.10 — MSW, Testing, and Integration Hardening

**Goal:** Make Sprint 2 features stable enough for iterative backend integration.

### Deliverables
- Extend MSW handlers for all new settings, feedback, search, export, share, versions, and observability endpoints
- Add realistic mock datasets for:
  - low-confidence answers
  - cached answers
  - grounded vs partially grounded answers
  - messages with invalid citations
  - documents with OCR / PII / version history / ACL indicators
- Add Vitest coverage for new critical UX paths
- Add Playwright coverage for at least one end-to-end Sprint 2 flow

### Tests to Add
- `SettingsForm` saves retrieval controls correctly
- `SearchScopePicker` passes selected document ids into send mutation
- `ChatMessage` renders confidence / grounding / cache / model badges correctly
- `FeedbackButtons` optimistic and error states
- `ConversationSearchInput` results + navigation behavior
- `VersionHistoryDrawer` rendering
- `ObservabilityPage` admin visibility guards

### E2E Flow
- Admin logs in → changes retrieval settings → opens Knowledge Base → re-indexes a document → asks scoped question → sees confidence/grounding badges → submits thumbs-down feedback

### Acceptance Criteria
- New features work end-to-end with MSW and without backend dependency
- No regression to existing Stage 1–12 chat and knowledge base flows
- Sprint 2 UI remains responsive at 375px / 768px / 1280px

---

## Suggested Build Order

| Stage | Priority | Why first | Status |
|---|---|---|---|
| S2.1 | P0 | Unlocks retrieval controls and scoped chat UX immediately | ✅ DONE |
| S2.2 | P0 | Makes ingestion/document management production-ready | ✅ DONE |
| S2.3 | P1 | Improves conversation continuity and engagement | ✅ DONE |
| S2.4 | P0 | Adds answer trust and fallback clarity | ✅ DONE |
| S2.5 | P1 | Useful power-user visibility with low UI risk | ✅ DONE |
| S2.6 | P0 | Required foundation for feedback loop and later evals |
| S2.7 | P1 | High user value once core trust/feedback features exist |
| S2.8 | P2 | Admin-facing, can land after end-user improvements |
| S2.9 | P2 | Governance/admin flows can follow later in the sprint |
| S2.10 | P0 | Prevents unstable integration and regression |

---

## Summary

| Stage | Focus | Key Output | Status |
|---|---|---|---|
| S2.1 | Retrieval controls | Settings sliders/toggles + chat scope picker | ✅ DONE |
| S2.2 | Ingestion UX | OCR/PII/version badges, queue state, re-index, version drawer | ✅ DONE |
| S2.3 | Conversation continuity | Memory indicator + suggested follow-up pills | ✅ DONE |
| S2.4 | Trust signals | Confidence, grounding, citation warnings, no-answer state | ✅ DONE |
| S2.5 | Context visibility | Token usage footer in source panel | ✅ DONE |
| S2.6 | Feedback loop | Thumbs up/down with optional negative comment |
| S2.7 | Conversation utilities | Search, export, share, read-only shared page |
| S2.8 | Observability | Evaluation, feedback, cost, audit frontend surfaces |
| S2.9 | Governance | ACL panel, retention field, erasure action |
| S2.10 | Hardening | MSW contracts + tests for all new Sprint 2 features |

---

## Exclusions for This Sprint

These are intentionally deferred unless backend readiness arrives early:

- Connectors tab and connector credential forms
- Experiment comparison UI (A/B retrieval experiments)
- Full citation-verification admin analytics beyond inline warning states
- OCR preview or structured table-preview UI
- Rich per-document detail pages beyond the required drawer/panel work

