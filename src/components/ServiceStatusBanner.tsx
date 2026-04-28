import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, X, Copy, Check } from "lucide-react";
import { httpClient } from "../services/httpClient";
import { config } from "../lib/config";
import { Button } from "./ui/Button";

export function ServiceStatusBanner() {
  const [checks, setChecks] = useState<Record<string, "ok" | "fail"> | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runChecks() {
    setIsRetrying(true);
    const results: Record<string, "ok" | "fail"> = {};

    // Health check
    try {
      await httpClient.get("/api/health");
      results["health"] = "ok";
    } catch {
      results["health"] = "fail";
    }

    // Readiness check (DB/Redis/vectorstore)
    try {
      const res = await httpClient.get("/api/ready");
      results["ready"] = res.status === 200 ? "ok" : "fail";
    } catch {
      results["ready"] = "fail";
    }

    setChecks(results);
    setIsRetrying(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing async check on mount
    void runChecks();
  }, []);

  const isBackendDown =
    checks && (checks.health === "fail" || checks.ready === "fail");
  const apiBaseUrl = config.apiBaseUrl || "/ (MSW mode — no real backend)";

  if (dismissed || !isBackendDown) return null;

  const envSnippet = `VITE_API_BASE_URL=http://127.0.0.1:6333`;

  function handleCopy() {
    navigator.clipboard.writeText(envSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/50">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          Backend unavailable
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
          Current API base: <code className="text-xs">{apiBaseUrl}</code>
          {" — "}
          {checks?.health === "fail" && "Health check failed. "}
          {checks?.ready === "fail" &&
            "Readiness check failed (DB/Redis/vectorstore may be down). "}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={runChecks}
            disabled={isRetrying}
            className="gap-1.5 h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
          >
            <RefreshCw
              className={`h-3 w-3 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Checking…" : "Retry"}
          </Button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied!" : "Copy env snippet"}
          </button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-400"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
