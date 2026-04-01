import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RAGSettings } from "../../types";

const DEFAULT_SETTINGS: RAGSettings = {
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

interface SettingsState {
  settings: RAGSettings;
  setSettings: (settings: RAGSettings) => void;
  updateSettings: (updates: Partial<RAGSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      setSettings: (settings) => set({ settings }),

      updateSettings: (updates) =>
        set((s) => ({
          settings: { ...s.settings, ...updates },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "rag-settings",
    },
  ),
);
