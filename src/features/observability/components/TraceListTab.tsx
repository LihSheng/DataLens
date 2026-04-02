import { ExternalLink, Clock, GitBranch } from "lucide-react";
import { useTraces } from "../hooks";
import { Button } from "../../../components/ui/Button";
import { TraceDetailDrawer } from "./TraceDetailDrawer";
import { useState } from "react";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function formatLatency(ms?: number): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function TraceRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </td>
      ))}
    </tr>
  );
}

export function TraceListTab() {
  const traces = useTraces();
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Recent Traces</h2>
          <p className="text-sm text-muted-foreground">
            Live view of LLM spans and evaluations — refreshes every 30s.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ExternalLink className="h-4 w-4" />}
          onClick={() => window.open("/phoenix", "_blank")}
        >
          Open Phoenix
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Trace ID
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Start Time
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Latency
              </th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Spans
              </th>
            </tr>
          </thead>
          <tbody>
            {traces.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TraceRowSkeleton key={i} />
              ))}

            {!traces.isLoading && traces.data?.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No traces found. Try running a chat query first.
                </td>
              </tr>
            )}

            {!traces.isLoading &&
              traces.data?.map((t) => (
                <tr
                  key={t.traceId}
                  className="border-b border-border cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedTraceId(t.traceId)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary">
                    {t.traceId.length > 16
                      ? `${t.traceId.slice(0, 8)}…${t.traceId.slice(-8)}`
                      : t.traceId}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(t.startTime)}
                  </td>
                  <td className="px-4 py-3">{formatLatency(t.latencyMs)}</td>
                  <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5" />
                    {t.numSpans}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      <TraceDetailDrawer
        traceId={selectedTraceId}
        onClose={() => setSelectedTraceId(null)}
      />
    </div>
  );
}
