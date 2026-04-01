import { useMutation } from "@tanstack/react-query";
import { httpClient } from "../../../services/httpClient";
import type { AxiosRequestConfig } from "axios";

type ExportFormat = "md" | "pdf";

export function useExportConversation(conversationId: string) {
  const mutation = useMutation({
    mutationFn: async (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _format: ExportFormat,
    ): Promise<string> => {
      const config: AxiosRequestConfig = { responseType: "text" };
      const res = await httpClient.get<string>(
        `/api/conversations/${conversationId}/export`,
        config,
      );
      return res.data;
    },
    onSuccess: (content: string, format: ExportFormat) => {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation.${format === "pdf" ? "md" : "md"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  return mutation;
}
