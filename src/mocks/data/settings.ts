import type { RAGSettings } from "../../types";

export const DEFAULT_RAG_SETTINGS: RAGSettings = {
  modelName: "gpt-4o-mini",
  topK: 5,
  temperature: 0.7,
  maxTokens: 2048,
  showSourcesPanel: true,
  enableStreaming: true,
  hybridWeightDense: 0.5,
  rerankerEnabled: false,
  queryExpansionEnabled: false,
  hydeEnabled: false,
  chunkingStrategy: "semantic",
  confidenceThreshold: 0.5,
  memoryWindow: 5,
  conversationRetentionDays: 30,
};

let settings: RAGSettings = { ...DEFAULT_RAG_SETTINGS };

export const getSettings = () => ({ ...settings });

export const updateSettings = (updates: Partial<RAGSettings>) => {
  settings = { ...settings, ...updates };
  return { ...settings };
};

export const resetSettings = () => {
  settings = { ...DEFAULT_RAG_SETTINGS };
  return { ...settings };
};
