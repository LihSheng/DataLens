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

export type ChunkingStrategy = "semantic" | "recursive" | "fixed";
export type ConfidenceLevel = "high" | "medium" | "low";
export type FeedbackRating = "positive" | "negative";

export interface ChatFilters {
  document_ids?: string[];
  doc_type?: string;
}

export interface CitationValidity {
  citation: string;
  valid: boolean;
}

export interface GroundingInfo {
  unsupported_count: number;
  fully_grounded: boolean;
  unsupported_sentences?: string[];
}

export interface TokenUsage {
  used: number;
  available: number;
  chunksIncluded: number;
  chunksAvailable: number;
}

export interface MessageFeedback {
  messageId: string;
  conversationId: string;
  traceId: string;
  rating: FeedbackRating;
  comment?: string;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  uploadedAt: string;
  status: "processing" | "ready" | "failed";
  isActive: boolean;
}

export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  status: "processing" | "ready" | "failed";
  extension: string;
  parseError?: string;
  ocrApplied?: boolean;
  piiEntitiesFound?: string[];
  version?: number;
  restricted?: boolean;
  queuePosition?: number;
}

export interface RAGSettings {
  modelName: string;
  topK: number;
  temperature: number;
  maxTokens: number;
  showSourcesPanel: boolean;
  enableStreaming: boolean;
  hybridWeightDense: number;
  rerankerEnabled: boolean;
  queryExpansionEnabled: boolean;
  hydeEnabled: boolean;
  chunkingStrategy: ChunkingStrategy;
  confidenceThreshold: number;
  memoryWindow: number;
  conversationRetentionDays: number;
}

// ─── API Types ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
