// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Chat Types ─────────────────────────────────────────────────────────────

export interface Source {
  id?: string;
  documentId: string;
  documentName: string;
  chunkText: string;
  pageNumber?: number;
  relevanceScore: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  message: Message;
  sources: Source[];
}

// ─── Document Types ──────────────────────────────────────────────────────────

export type DocumentStatus = "processing" | "ready" | "failed";

export interface Document {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: DocumentStatus;
  uploadedAt: string;
  chunkCount?: number;
}

// ─── Settings Types ─────────────────────────────────────────────────────────

export interface RAGSettings {
  modelName: string;
  topK: number;
  temperature: number;
  maxTokens: number;
  showSourcesPanel: boolean;
  enableStreaming: boolean;
}

// ─── API Types ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
