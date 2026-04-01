# Phoenix RAG Observability — Arize Phoenix Integration Plan

> Sprint 2 — tracing UI design, Arize Phoenix integration architecture,
> and frontend observability for the RAG pipeline.

---

## What Arize Phoenix Provides

Arize Phoenix is an open-source ML observability platform focused on LLM and RAG pipelines.
For this system it gives:

- **Trace viewer** — end-to-end trace of every RAG call: retrieval latency, LLM latency, token counts
- **Span details** — individual spans for embedding, vector search, reranking, LLM generation
- **Retrieval quality** — which chunks were retrieved, their scores, whether they were used
- **LLM evals** — hallucination detection, relevance scoring, Q&A correctness (run async)
- **Dataset / experiment tracking** — compare retrieval configs (Top K, model, chunk size) over time

Phoenix runs as a sidecar service alongside your RAG backend. The frontend integrates in two ways:

1. **Trace ID linking** — every chat response carries a `traceId`; the frontend links to Phoenix
2. **Embedded observability panel** — an admin-only UI panel showing live trace data via Phoenix API

---

## Architecture Overview

```
Browser (React App)
   │
   │  POST /api/chat  →  { answer, sources, traceId }
   │
   ▼
RAG Backend (your API)
   │
   ├── Retrieval (vector DB)  ──┐
   ├── Reranking               ├──► OpenTelemetry spans
   └── LLM generation         ──┘
                                    │
                                    ▼
                             Arize Phoenix
                             (localhost:6006 or hosted)
                                    │
                                    ▼
                          Phoenix REST API
                          GET /v1/traces/:traceId
                          GET /v1/spans?traceId=...
```

The React frontend never instruments the RAG pipeline directly. It only:
- Receives `traceId` in the chat response
- Queries the Phoenix REST API to render trace data
- Links admins directly to the Phoenix trace viewer UI

---

## Backend Contract — `traceId` in Chat Response

The `ChatResponse` type is extended to carry observability metadata.

```ts
// src/types/index.ts

interface TraceMetadata {
  traceId: string
  retrievalLatencyMs: number
  llmLatencyMs: number
  totalLatencyMs: number
  tokensUsed: {
    prompt: number
    completion: number
    total: number
  }
  retrievedChunks: number    // how many chunks were retrieved (before reranking)
  usedChunks: number         // how many chunks were in the final context window
}

interface ChatResponse {
  answer: string
  sources: Source[]
  traceMetadata: TraceMetadata   // new field — always present in production
}
```

The backend emits OpenTelemetry spans (using `openinference-instrumentation` or `opentelemetry-sdk`)
and Phoenix collects them. The `traceId` is the OpenTelemetry trace ID, passed back in the response.

---

## Frontend Integration — Phase 1: Trace Linking

The simplest integration: show latency stats on the assistant message and link admins
directly to Phoenix.

### Changes to `ChatMessage`

```ts
function ChatMessage({ message }: { message: Message }) {
  const can = useAuthStore(s => s.can)
  const { traceMetadata } = message

  return (
    <div className="message message--assistant">
      <MessageText text={message.text} sources={message.sources} />

      {traceMetadata && (
        <div className="message-meta">
          <LatencyBadge ms={traceMetadata.totalLatencyMs} />
          <TokenBadge tokens={traceMetadata.tokensUsed.total} />
          {can('settings:read') && (
            <TraceLink traceId={traceMetadata.traceId} />
          )}
        </div>
      )}
    </div>
  )
}
```

### `TraceLink` Component

```ts
// src/features/chat/components/TraceLink.tsx

const PHOENIX_BASE_URL = config.VITE_PHOENIX_URL   // e.g. http://localhost:6006

function TraceLink({ traceId }: { traceId: string }) {
  const url = `${PHOENIX_BASE_URL}/traces/${traceId}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="trace-link">
      <ExternalLink size={12} />
      View trace
    </a>
  )
}
```

### `LatencyBadge` — colour coded

| Latency | Badge colour |
|---|---|
| < 1 000ms | Green |
| 1 000–3 000ms | Yellow |
| > 3 000ms | Red |

```ts
function LatencyBadge({ ms }: { ms: number }) {
  const colour = ms < 1000 ? 'green' : ms < 3000 ? 'yellow' : 'red'
  return <span className={`badge badge--${colour}`}>{(ms / 1000).toFixed(2)}s</span>
}
```

---

## Frontend Integration — Phase 2: Embedded Trace Panel (Admin Only)

An in-app observability panel at `/observability` (admin only) that queries Phoenix directly
and renders a condensed trace view without leaving the app.

### New Route

```ts
// src/router.tsx

{
  path: '/observability',
  element: (
    <RoleGuard permission="settings:read">
      <ObservabilityPage />
    </RoleGuard>
  ),
},
```

Add "Observability" to `NAV_ITEMS` with `permission: 'settings:read'`.

---

### Phoenix API Service

```ts
// src/services/api/phoenix.ts

const phoenixClient = axios.create({
  baseURL: config.VITE_PHOENIX_URL,
  // Note: no auth header — Phoenix is internal, not exposed to the internet
})

export const phoenixApi = {
  // Get a single trace by ID
  getTrace: (traceId: string): Promise<PhoenixTrace> =>
    phoenixClient.get(`/v1/traces/${traceId}`).then(r => r.data),

  // Get spans for a trace
  getSpans: (traceId: string): Promise<PhoenixSpan[]> =>
    phoenixClient.get(`/v1/spans`, { params: { traceId } }).then(r => r.data),

  // Recent traces (for the observability page trace list)
  getRecentTraces: (params: { limit?: number; startTime?: string }): Promise<PhoenixTrace[]> =>
    phoenixClient.get('/v1/traces', { params }).then(r => r.data),

  // Evaluation results for a trace
  getEvals: (traceId: string): Promise<PhoenixEval[]> =>
    phoenixClient.get(`/v1/evaluations`, { params: { traceId } }).then(r => r.data),
}
```

---

### Phoenix Types

```ts
// src/types/phoenix.ts

interface PhoenixTrace {
  traceId: string
  rootSpanName: string
  startTime: string
  endTime: string
  durationMs: number
  status: 'OK' | 'ERROR'
  spanCount: number
}

interface PhoenixSpan {
  spanId: string
  traceId: string
  parentSpanId: string | null
  name: string                        // e.g. 'retrieval', 'rerank', 'llm'
  spanKind: 'RETRIEVER' | 'LLM' | 'CHAIN' | 'TOOL'
  startTime: string
  endTime: string
  durationMs: number
  status: 'OK' | 'ERROR'
  attributes: {
    // Retrieval spans
    'retrieval.documents'?: RetrievedDocument[]
    // LLM spans
    'llm.model_name'?: string
    'llm.token_count.prompt'?: number
    'llm.token_count.completion'?: number
    'llm.input_messages'?: LLMMessage[]
    'llm.output_messages'?: LLMMessage[]
  }
}

interface PhoenixEval {
  name: string          // e.g. 'Hallucination', 'QA Correctness', 'Relevance'
  result: 'PASS' | 'FAIL' | 'UNKNOWN'
  score: number | null  // 0.0 – 1.0
  explanation: string
}
```

---

### Observability Page Layout

```
/observability
├── Header: "RAG Observability"  +  "Open Phoenix" external link button
├── Summary cards (last 24h):
│     Total queries | Avg latency | Avg tokens | Error rate
├── Trace list (React Query, polling every 30s):
│     Time | Query preview | Latency | Tokens | Evals | Status | "View" button
└── TraceDetailDrawer (slides in on "View"):
      ├── Query text
      ├── Answer preview
      ├── SpanWaterfall — visual timeline of spans
      ├── RetrievedChunkList — chunks with scores, highlights used vs unused
      └── EvalResults — Hallucination / Relevance / QA scores
```

---

### `SpanWaterfall` Component

Renders a Gantt-style waterfall of spans, similar to browser DevTools network panel.

```ts
// src/features/observability/components/SpanWaterfall.tsx

function SpanWaterfall({ spans }: { spans: PhoenixSpan[] }) {
  const traceStart = Math.min(...spans.map(s => new Date(s.startTime).getTime()))
  const traceEnd   = Math.max(...spans.map(s => new Date(s.endTime).getTime()))
  const totalMs    = traceEnd - traceStart

  return (
    <div className="waterfall">
      {spans.map(span => {
        const offsetPct = ((new Date(span.startTime).getTime() - traceStart) / totalMs) * 100
        const widthPct  = (span.durationMs / totalMs) * 100
        return (
          <div key={span.spanId} className="waterfall-row">
            <span className="waterfall-label">{span.name}</span>
            <div className="waterfall-track">
              <div
                className={`waterfall-bar waterfall-bar--${span.spanKind.toLowerCase()}`}
                style={{ marginLeft: `${offsetPct}%`, width: `${Math.max(widthPct, 1)}%` }}
                title={`${span.durationMs}ms`}
              />
            </div>
            <span className="waterfall-duration">{span.durationMs}ms</span>
          </div>
        )
      })}
    </div>
  )
}
```

**Span colours by kind:**
- `RETRIEVER` → Blue
- `LLM` → Purple
- `CHAIN` → Teal
- `TOOL` → Amber
- Error status → Red override

---

### `EvalResults` Component

```ts
function EvalResults({ evals }: { evals: PhoenixEval[] }) {
  return (
    <div className="eval-results">
      {evals.map(e => (
        <div key={e.name} className="eval-row">
          <span className="eval-name">{e.name}</span>
          <EvalBadge result={e.result} score={e.score} />
          <p className="eval-explanation">{e.explanation}</p>
        </div>
      ))}
    </div>
  )
}

function EvalBadge({ result, score }: { result: string; score: number | null }) {
  const colour = result === 'PASS' ? 'green' : result === 'FAIL' ? 'red' : 'gray'
  return (
    <span className={`badge badge--${colour}`}>
      {result} {score !== null && `(${(score * 100).toFixed(0)}%)`}
    </span>
  )
}
```

---

## Environment Variables

Add to `config.ts` and Vercel dashboard:

```
VITE_PHOENIX_URL=http://localhost:6006    # dev
VITE_PHOENIX_URL=https://phoenix.internal.yourdomain.com   # production
```

Phoenix should NOT be exposed to the public internet. In production, put it behind
your internal network or Vercel's protected preview URLs, and access it from the
frontend only — the browser makes requests directly to Phoenix.

---

## Deployment — Phoenix in Production

### Option A: Self-hosted on the same server as the RAG backend

```yaml
# docker-compose.yml (backend server)
services:
  rag-api:
    build: .
    environment:
      PHOENIX_COLLECTOR_ENDPOINT: http://phoenix:6006/v1/traces
  phoenix:
    image: arizephoenix/phoenix:latest
    ports:
      - "6006:6006"
    volumes:
      - phoenix-data:/data
volumes:
  phoenix-data:
```

The frontend reaches Phoenix via `VITE_PHOENIX_URL`. Since Phoenix runs on the same
server as the API, you can proxy through the API to avoid CORS issues:

```
GET /api/phoenix/traces  →  backend proxies to  →  http://phoenix:6006/v1/traces
```

This is the recommended approach — Phoenix is never directly reachable from outside.

### Option B: Arize Cloud (managed Phoenix)

Use `VITE_PHOENIX_URL=https://app.phoenix.arize.com` with an API key.
Add `VITE_PHOENIX_API_KEY` to `config.ts` and pass it in `phoenixClient` headers.

---

## Phased Rollout

### Phase 1 — Trace Linking (Sprint 2)
- Backend adds `traceId` to `ChatResponse`
- `ChatMessage` shows latency badge + "View trace" link for admins
- No new routes or pages

### Phase 2 — Observability Page (Sprint 3)
- `/observability` route with `ObservabilityPage`
- `SpanWaterfall`, `EvalResults`, `RetrievedChunkList`
- Phoenix API service layer
- Summary metric cards with 24h window

### Phase 3 — Eval Integration (Sprint 4)
- Evals run async server-side after each response
- Frontend polls for eval results and updates `EvalResults` panel
- Admin can manually trigger a re-eval on any historical trace
- Export traces to CSV for offline analysis

---

## MSW Handlers for Phoenix (dev + test)

```ts
// src/mocks/handlers/phoenix.ts

http.get('/api/phoenix/traces', () => {
  return HttpResponse.json({ traces: MOCK_TRACES })
})

http.get('/api/phoenix/traces/:traceId', ({ params }) => {
  const trace = MOCK_TRACES.find(t => t.traceId === params.traceId)
  if (!trace) return new HttpResponse(null, { status: 404 })
  return HttpResponse.json(trace)
})

http.get('/api/phoenix/spans', ({ request }) => {
  const url = new URL(request.url)
  const traceId = url.searchParams.get('traceId')
  return HttpResponse.json({ spans: MOCK_SPANS.filter(s => s.traceId === traceId) })
})

http.get('/api/phoenix/evaluations', ({ request }) => {
  const url = new URL(request.url)
  const traceId = url.searchParams.get('traceId')
  return HttpResponse.json({ evals: MOCK_EVALS[traceId] ?? [] })
})
```

---

## Summary

| Component | Description | Sprint |
|---|---|---|
| `TraceMetadata` type | Extended `ChatResponse` with traceId + latency | 2 |
| `LatencyBadge` | Colour-coded latency on message bubble | 2 |
| `TraceLink` | Admin-only link to Phoenix trace viewer | 2 |
| `phoenixApi` service | Typed wrapper for Phoenix REST API | 3 |
| `ObservabilityPage` | Full trace list + detail drawer | 3 |
| `SpanWaterfall` | Gantt-style span timeline | 3 |
| `EvalResults` | Hallucination / relevance eval display | 3 |
| Eval polling | Async eval results streamed to frontend | 4 |
| Export | CSV export of trace history | 4 |
