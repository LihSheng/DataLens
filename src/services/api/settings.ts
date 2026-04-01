import { httpClient } from "../../services/httpClient";
import type { RAGSettings } from "../../types";

export const settingsApi = {
  getSettings: async (): Promise<RAGSettings> => {
    const { data } = await httpClient.get<RAGSettings>("/api/settings");
    return data;
  },

  updateSettings: async (
    settings: Partial<RAGSettings>,
  ): Promise<RAGSettings> => {
    const { data } = await httpClient.post<RAGSettings>(
      "/api/settings",
      settings,
    );
    return data;
  },
};
