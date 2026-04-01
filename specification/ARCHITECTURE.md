# Store Architecture — Zustand Design & Streaming Interaction

> Covers the internal design of all Zustand stores, with a deep-dive on how
> `chatStore` and `uiStore` coordinate during a streaming chat response.

---

## Store Inventory

| Store | Location | Persisted | Purpose |
|---|---|---|---|
| `authStore` | `features/auth/store.ts` | Yes (token only) | Session, user identity, login/logout |
| `chatStore` | `features/chat/store.ts` | No | Conversations, messages, stream state |
| `documentStore` | `features/knowledge/store.ts` | No | Upload queue, document list cache |
| `settingsStore` | `features/settings/store.ts` | Yes (full) | RAG config, persisted across sessions |
| `uiStore` | `store/uiStore.ts` | No | Toasts, sidebar, modals, source panel |

**Rule:** Stores never import each other. Cross-store reads happen in components or hooks via
`useAuthStore()`, `useChatStore()`, etc. called side by side. Cross-store writes are coordinated
in action hooks (e.g. `useSendMessage`), not inside a store's own actions.

---

## Store Definitions

### `authStore`

```ts
interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  login(credentials: UsernamePasswordCredentials | OAuthTokenCredentials): Promise<void>
  logout(): void
  setToken(token: string): void
  _setUser(user: User): void          // internal, called by login()
}
```

**Persistence:** `accessToken` only. `user` is re-fetched from `/api/me` on app boot using the
persisted token. This avoids stale user data surviving a role change on the server.

```ts
// Rehydration on app boot — src/App.tsx
useEffect(() => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    api.getMe().then(user => authStore.getState()._setUser(user))
               .catch(() => authStore.getState().logout())
  }
}, [])
```

---

### `chatStore`

```ts
interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  // Messages are keyed by conversationId to avoid mixing threads
  messagesByConversationId: Record<string, Message[]>
  streamState: StreamState | null
}

interface StreamState {
  conversationId: string
  messageId: string          // ID of the in-progress assistant message
  buffer: string             // Accumulated text so far
  status: 'streaming' | 'done' | 'error'
}

interface ChatActions {
  setActiveConversation(id: string): void
  addConversation(conv: Conversation): void
  appendMessage(conversationId: string, message: Message): void
  // Called repeatedly as stream chunks arrive
  appendStreamChunk(chunk: string): void
  // Called when stream ends — promotes buffer into a real Message
  finaliseStream(sources: Source[]): void
  // Called on stream error
  failStream(error: string): void
  // For optimistic send — adds user message immediately
  addOptimisticUserMessage(conversationId: string, text: string): Message
}
```

**Key design decisions:**

- `messagesByConversationId` is a `Record` not an array so switching conversations is O(1)
  and never causes thread mixing regardless of request timing.
- `streamState.buffer` accumulates raw text. The `ChatMessage` component reads `streamState`
  when the `messageId` matches, falling back to the final stored `Message` otherwise.
- `finaliseStream()` atomically: moves `buffer` into the `messages` record, attaches `sources`,
  clears `streamState`. This means there is never a frame where neither exists.

---

### `uiStore`

```ts
interface UIState {
  isSidebarOpen: boolean
  toasts: Toast[]
  activeModal: ModalConfig | null
  sourcePanel: {
    isOpen: boolean
    highlightedSourceId: string | null
  }
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  durationMs: number
}

interface ModalConfig {
  type: 'confirm-delete' | 'rename-conversation' | 'upload'
  payload: Record<string, unknown>
}

interface UIActions {
  openSidebar(): void
  closeSidebar(): void
  toggleSidebar(): void
  pushToast(toast: Omit<Toast, 'id'>): string   // returns id for programmatic dismiss
  dismissToast(id: string): void
  openModal(config: ModalConfig): void
  closeModal(): void
  openSourcePanel(highlightedId?: string): void
  closeSourcePanel(): void
  highlightSource(sourceId: string): void
}
```

---

## Streaming Response — Full Interaction Trace

This is the most complex coordination in the app. Below is the complete sequence from
"user hits Send" to "stream complete, sources visible".

```
User hits Send
     │
     ▼
useSendMessage hook (the single coordinator)
     │
     ├─ 1. chatStore.addOptimisticUserMessage()
     │        → user bubble appears immediately
     │
     ├─ 2. chatStore.appendMessage() with a placeholder assistant Message
     │        id: uuid(), role: 'assistant', text: '', status: 'streaming'
     │
     ├─ 3. chatStore sets streamState = { conversationId, messageId, buffer: '', status: 'streaming' }
     │
     ├─ 4. uiStore.openSourcePanel() NOT called yet — panel opens only after sources arrive
     │
     ├─ 5. streamClient.send(conversationId, text) → returns AsyncIterable<StreamChunk>
     │
     └─ 6. for await (const chunk of stream):
               chatStore.appendStreamChunk(chunk.text)
                    → streamState.buffer += chunk.text
                    → ChatMessage reads buffer, renders with blinking cursor
                    → ChatWindow scroll anchor fires (useEffect on buffer length)
     │
     ├─ 7. Stream ends (done signal from server):
     │        chatStore.finaliseStream(sources)
     │             → messagesByConversationId[id].push({ ...placeholder, text: buffer, sources })
     │             → streamState = null
     │             → blinking cursor disappears (ChatMessage falls back to stored Message)
     │
     └─ 8. If sources.length > 0:
               uiStore.openSourcePanel()
                    → SourcePanel slides in
               uiStore.highlightSource(sources[0].id)
                    → first SourceCard gets highlight ring
```

### Stream Error Path

```
     ├─ Stream throws / server closes with error:
     │        chatStore.failStream(errorMessage)
     │             → sets streamState.status = 'error'
     │             → placeholder message updated: status = 'error', text = ''
     │
     └─ uiStore.pushToast({ type: 'error', message: 'Response failed. Try again.' })
          → ChatMessage renders an inline retry banner (reads status === 'error')
          → Retry calls useSendMessage again with the same text
```

---

## `useSendMessage` — The Coordinator Hook

This hook is the only place that writes to both `chatStore` and `uiStore` in sequence.
It keeps both stores free of circular dependencies.

```ts
// src/features/chat/hooks/useSendMessage.ts

export function useSendMessage() {
  const { appendStreamChunk, finaliseStream, failStream,
          addOptimisticUserMessage, appendMessage, activeConversationId } = useChatStore()
  const { pushToast, openSourcePanel, highlightSource } = useUIStore()

  return async function sendMessage(text: string) {
    if (!activeConversationId) return

    // 1. Optimistic user message
    addOptimisticUserMessage(activeConversationId, text)

    // 2. Placeholder assistant message
    const placeholderId = crypto.randomUUID()
    appendMessage(activeConversationId, {
      id: placeholderId,
      role: 'assistant',
      text: '',
      status: 'streaming',
      sources: [],
      createdAt: new Date().toISOString(),
    })

    try {
      // 3. Open stream
      const stream = streamClient.send(activeConversationId, text)

      // 4. Consume chunks
      for await (const chunk of stream) {
        appendStreamChunk(chunk.text)
      }

      // 5. Finalise — stream returns sources in the final frame
      const { sources } = await stream.getMetadata()
      finaliseStream(sources)

      // 6. Open source panel if there are sources
      if (sources.length > 0) {
        openSourcePanel()
        highlightSource(sources[0].id)
      }

    } catch (err) {
      failStream(err instanceof Error ? err.message : 'Unknown error')
      pushToast({ type: 'error', message: 'Response failed. Try again.', durationMs: 5000 })
    }
  }
}
```

---

## `ChatMessage` — Reading Stream vs Final State

The component has one rule: if a `streamState` exists for this message ID, render the buffer.
Otherwise render the stored message. This prevents a flicker frame.

```ts
// src/features/chat/components/ChatMessage.tsx

function ChatMessage({ message }: { message: Message }) {
  const streamState = useChatStore(s => s.streamState)

  const isStreaming = streamState?.messageId === message.id
  const displayText = isStreaming ? streamState!.buffer : message.text
  const showCursor  = isStreaming && streamState!.status === 'streaming'

  return (
    <div className={`message message--${message.role}`}>
      <span>{displayText}</span>
      {showCursor && <span className="cursor-blink" aria-hidden="true">▌</span>}
      {message.status === 'error' && <RetryBanner messageId={message.id} />}
      {!isStreaming && message.sources.length > 0 && <CitationChips sources={message.sources} />}
    </div>
  )
}
```

---

## Selector Pattern — Preventing Unnecessary Re-renders

Always select the minimal slice. Never read the whole store in a component.

```ts
// Bad — re-renders on any store change
const store = useChatStore()

// Good — re-renders only when activeConversationId changes
const activeId = useChatStore(s => s.activeConversationId)

// Good — stable reference for a derived list
const messages = useChatStore(
  s => s.messagesByConversationId[s.activeConversationId ?? ''] ?? [],
  shallow   // from zustand/shallow — prevents re-render if array contents didn't change
)
```

---

## Persistence Configuration

```ts
// settingsStore — full persistence
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'rag-settings' }
  )
)

// authStore — token only
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'rag-auth',
      partialize: (state) => ({ accessToken: state.accessToken })
      //          ^ only persist the token, not the user object
    }
  )
)

// All other stores — no persistence (server is source of truth)
export const useChatStore    = create<ChatState & ChatActions>()((set, get) => ({ /* ... */ }))
export const useUIStore      = create<UIState & UIActions>()((set) => ({ /* ... */ }))
export const useDocumentStore = create<DocumentState & DocumentActions>()((set) => ({ /* ... */ }))
```
