# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DataLens is a RAG (Retrieval-Augmented Generation) chatbot application with:
- **Frontend**: React 19 + TypeScript + Vite (in `DataLens/`)
- **Backend**: FastAPI + Python (in `DataLens-backend/`)

## Commands

### Frontend (DataLens/)
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run test         # Run Vitest unit tests
npm run test:watch   # Watch mode for tests
npm run test:e2e     # Run Playwright E2E tests
```

### Backend (DataLens-backend/)
```bash
# Start dev server (from DataLens-backend/)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Architecture

### Frontend State Management (Zustand)

Five stores in `src/features/*/store.ts` and `src/store/`:

| Store | Persisted | Purpose |
|-------|-----------|---------|
| `authStore` | Token only | Session, user identity. User re-fetched from `/api/me` on boot using persisted token. |
| `chatStore` | No | Conversations, messages, stream state |
| `documentStore` | No | Upload queue, document cache |
| `settingsStore` | Full | RAG config, persisted |
| `uiStore` | No | Toasts, sidebar, modals, source panel |

**Critical pattern**: Use **selector syntax** to avoid re-renders:
```ts
// Bad — re-renders on any change
const store = useChatStore()

// Good — only re-renders when activeConversationId changes
const activeId = useChatStore(s => s.activeConversationId)

// Good — use shallow equality for derived arrays
const messages = useChatStore(s => s.messagesByConversationId[id] ?? [], shallow)
```

### Streaming Chat Architecture

The streaming response coordination is complex — see `specification/ARCHITECTURE.md` for full details:

1. `useSendMessage` hook is the single coordinator writing to both `chatStore` and `uiStore`
2. `streamState` in chatStore accumulates chunks as they arrive
3. `ChatMessage` component checks if `streamState.messageId` matches — renders buffer with blinking cursor if so, falls back to stored message
4. `finaliseStream()` atomically moves buffer to messages and clears streamState
5. Source panel opens only after stream completes with sources

### Backend Structure

```
DataLens-backend/
├── main.py              # FastAPI app entry, core /ingest and /query endpoints
├── config.py            # LLM provider config (Groq/MiniMax), vector store settings
├── app/
│   ├── api/             # Route handlers (auth, chat, documents, search, etc.)
│   ├── models/          # SQLAlchemy models
│   ├── db/              # Database session management, migrations
│   ├── chains/          # LangChain chain definitions
│   ├── retrieval/       # BM25, hybrid retriever, reranker, query expansion
│   ├── memory/          # Conversation memory, followup generation
│   ├── quality/         # Grounding checks, citation extraction
│   ├── routing/         # Model router (Groq vs MiniMax)
│   ├── safety/          # LLM Guard guardrails
│   ├── ingestion/       # Document parsing, chunking, OCR, PII detection
│   └── export/          # PDF, Markdown export
```

### Key Dependencies

**Frontend**: React 19, TanStack Query v5, Zustand v5, Tailwind CSS, Axios, React Router v7, Sentry, Vitest, Playwright, MSW

**Backend**: FastAPI, SQLAlchemy + asyncpg, Alembic, Redis + Celery, LangChain, ChromaDB, FAISS, LangChain Groq/OpenAI, sentence-transformers, ragas, llm-guard, presidio-analyzer, Arize Phoenix

### Environment Variables

**Frontend**: `VITE_API_BASE_URL` — Backend API URL (default: `/api`)

**Backend**: `GROQ_API_KEY`, `MINIMAX_API_KEY`, `VECTORSTORE_TYPE` (memory/milvus), `MILVUS_HOST`, `MILVUS_PORT`
