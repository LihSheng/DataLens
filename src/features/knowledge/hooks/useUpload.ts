import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useKnowledgeStore } from "../store";
import { useUIStore } from "../../../store/uiStore";
import { uploadDocument } from "../../../services/api/documents";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];

function isAccepted(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return ACCEPTED_EXTENSIONS.includes(ext);
}

export function useUpload() {
  const queryClient = useQueryClient();
  const { uploadQueue, addUploadItem, updateUploadItem } = useKnowledgeStore();
  const addToast = useUIStore((s) => s.addToast);

  const isUploading = uploadQueue.some(
    (u) => u.status === "uploading" || u.status === "processing",
  );

  const uploadFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        if (!isAccepted(file)) continue;

        const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        addUploadItem({ id, file, progress: 0, status: "uploading" });

        // Simulate progress 0 → 100 over 1.5s
        let progress = 0;
        const intervalId = setInterval(() => {
          progress += 100 / 15; // 15 steps over 1500ms = 100ms each
          if (progress >= 100) {
            progress = 100;
            clearInterval(intervalId);
            updateUploadItem(id, { progress: 100, status: "processing" });
          } else {
            updateUploadItem(id, { progress });
          }
        }, 100);

        uploadDocument(file)
          .then(() => {
            clearInterval(intervalId);
            updateUploadItem(id, { progress: 100, status: "done" });
            // Refetch documents after 3.5s to pick up status change from 'processing' to 'ready'
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["documents"] });
            }, 3500);
          })
          .catch(() => {
            clearInterval(intervalId);
            updateUploadItem(id, { status: "failed" });
            addToast(`Failed to upload "${file.name}"`, "error");
          });
      }
    },
    [addUploadItem, updateUploadItem, queryClient, addToast],
  );

  return { uploadFiles, uploadQueue, isUploading };
}
