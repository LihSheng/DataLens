import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { useUpload } from "../hooks/useUpload";
import { UploadProgressBar } from "./UploadProgressBar";

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

export function FileUploader() {
  const { uploadFiles, uploadQueue } = useUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const invalid = arr.filter((f) => !isAccepted(f));
      if (invalid.length > 0) {
        setError(
          `Unsupported file type: ${invalid.map((f) => f.name).join(", ")}`,
        );
        return;
      }
      setError(null);
      uploadFiles(arr);
    },
    [uploadFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeError = () => setError(null);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files — click or drop files here"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById("file-input")?.click()}
        onKeyDown={(e) =>
          e.key === "Enter" && document.getElementById("file-input")?.click()
        }
        className={[
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8",
          "cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
        ].join(" ")}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium">
          Drop files here or <span className="text-primary">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, TXT, MD — max 10 MB each
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <button
            onClick={removeError}
            aria-label="Dismiss error"
            className="ml-2 shrink-0 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2 rounded-lg border bg-card p-3">
          {uploadQueue.map((item) => (
            <UploadProgressBar
              key={item.id}
              fileName={item.file.name}
              progress={item.progress}
              status={item.status}
              onRetry={
                item.status === "failed"
                  ? () => handleFiles([item.file])
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
