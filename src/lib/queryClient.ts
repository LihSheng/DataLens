import { QueryClient } from "@tanstack/react-query";
import { apiErrorFromUnknown } from "../services/apiClient";
import { useUIStore } from "../store/uiStore";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      onError: (err) => {
        const apiError = apiErrorFromUnknown(err);
        useUIStore.getState().pushToast({
          type: "error",
          message: apiError.message,
        });
      },
    },
  },
});
