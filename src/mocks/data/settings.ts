import type { RAGSettings } from "../../types";

export const DEFAULT_RAG_SETTINGS: RAGSettings = {
  modelName: "gpt-4o-mini",
  topK: 5,
  temperature: 0.7,
  maxTokens: 2048,
  showSourcesPanel: true,
  enableStreaming: true,
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
