import { X, GitBranch, Award, Layers } from "lucide-react";
import { useTraceDetail } from "../hooks";
import type { Span, EvalScore } from "../../../types/observability";
import { Badge } from "../../../components/ui/Badge";

function formatDuration(ms?: number): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ─── Span Waterfall ───────────────────────────────────────────────────────────

interface SpanNode {
  span: Span;
  depth: number;
  children: SpanNode[];
}

function buildSpanTree(spans: Span[]): SpanNode[] {
  const map = new Map<string, SpanNode>();
  spans.forEach((s) => map.set(s.spanId, { span: s, depth: 0, children: [] }));

  const roots: SpanNode[] = [];
  map.forEach((node) => {
    const pId = node.span.parentSpanId;
    if (pId && map.has(pId)) {
      node.depth = map.get(pId)!.depth + 1;
      map.get(pId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function renderSpanNode(node: SpanNode): JSX.Element {
  const { span, depth, children } = node;
  return (
    <div key={span.spanId}>
      <div
        className="flex items-center gap-3 px-4 py-2 text-sm border-b border-border/50 hover:bg-muted/40 transition-colors"
        style={{ paddingLeft: `${1 + depth * 1.5}rem` }}
      >
        {/* Indent guide */}
        {depth > 0 && (
          <div
            className="absolute h-4 w-px bg-border"
            style={{ left: `${0.75 + (depth - 1) * 1.5 + 0.25}rem` }}
          />
        )}

        <span className="flex-shrink-0 text-muted-foreground font-mono text-xs">
          {span.name}
        </span>

        <span className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
          {formatDuration(span.duration)}
        </span>

        {span.status && (
          <Badge
            variant={
              span.status === "ok" || span.status === "OK"
                ? "success"
                : span.status === "error"
                  ? "destructive"
                  : "outline"
            }
          >
            {span.status}
          </Badge>
        )}
      </div>

      {children.map((child) => renderSpanNode(child))}
    </div>
  );
}

// ─── Eval Score Card ──────────────────────────────────────────────────────────

const EVAL_LABELS: Record<string, string> = {
  faithfulness: "Faithfulness",
  answer_relevance: "Answer Relevance",
  context_precision: "Context Precision",
  HallucinationScore: "Hallucination",
  CorrectnessScore: "Correctness",
};

function scoreColor(label: number | string): string {
  const n = typeof label === "number" ? label : parseFloat(String(label));
  if (isNaN(n)) return "text-muted-foreground";
  if (n >= 0.8) return "text-green-600 dark:text-green-400";
  if (n >= 0.6) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function EvalScoreRow({ name, label, score }: EvalScore) {
  const displayName = EVAL_LABELS[name] ?? name;
  const normalizedLabel = typeof label === "number" ? label.toFixed(2) : label;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{displayName}</span>
      <div className="flex items-center gap-2">
        {score != null && (
          <span className="text-xs text-muted-foreground">
            score: {score.toFixed(2)}
          </span>
        )}
        <span className={`font-medium ${scoreColor(label)}`}>
          {normalizedLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Retriever Chunks ─────────────────────────────────────────────────────────

function RetrieverChunks({
  attributes,
}: {
  attributes: Record<string, unknown>;
}) {
  const chunks = attributes?.retrieval_chunks as
    | Array<Record<string, unknown>>
    | undefined;
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="space-y-2">
      {chunks.map((chunk, i) => (
        <div
          key={i}
          className="rounded border border-border p-3 text-sm bg-muted/30"
        >
          <p className="text-xs text-muted-foreground mb-1 font-medium">
            Chunk {i + 1}
            {chunk.score != null && (
              <span className="ml-2 text-muted-foreground/60">
                score: {parseFloat(String(chunk.score)).toFixed(3)}
              </span>
            )}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {String(chunk.content ?? chunk.text ?? "").slice(0, 300)}
            {JSON.stringify(chunk.content ?? chunk.text ?? "").length > 300
              ? "…"
              : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface TraceDetailDrawerProps {
  traceId: string | null;
  onClose: () => void;
}

export function TraceDetailDrawer({
  traceId,
  onClose,
}: TraceDetailDrawerProps) {
  const { data, isLoading } = useTraceDetail(traceId);

  if (!traceId) return <div />;

  const spans: Span[] = data?.spans ?? [];
  const evals: EvalScore[] = data?.evals ?? [];
  const spanTree = buildSpanTree(spans);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-xl bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Trace Details</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {traceId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-md bg-muted animate-pulse"
                />
              ))}
            </div>
          )}

          {!isLoading && data && (
            <>
              {/* Span Waterfall */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Span Waterfall</h3>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {spans.length} spans
                  </span>
                </div>
                {spanTree.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No spans recorded for this trace.
                  </p>
                ) : (
                  <div className="rounded-md border border-border overflow-hidden relative">
                    {spanTree.map((node) => renderSpanNode(node))}
                  </div>
                )}
              </section>

              {/* Eval Scores */}
              {evals.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Eval Scores</h3>
                  </div>
                  <div className="rounded-md border border-border p-4 bg-card">
                    {evals.map((ev, i) => (
                      <EvalScoreRow key={i} {...ev} />
                    ))}
                  </div>
                </section>
              )}

              {/* Retrieved Chunks */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Retrieved Chunks</h3>
                </div>

                {/* Try to find chunks in any span attributes */}
                {(() => {
                  const allChunks: Array<{
                    spanName: string;
                    attrs: Record<string, unknown>;
                  }> = [];
                  spans.forEach((s) => {
                    const chunks = s.attributes?.retrieval_chunks as
                      | Array<Record<string, unknown>>
                      | undefined;
                    if (chunks && chunks.length > 0) {
                      allChunks.push({
                        spanName: s.name,
                        attrs: s.attributes ?? {},
                      });
                    }
                  });

                  if (allChunks.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-md">
                        No retrieval chunks found.
                      </p>
                    );
                  }

                  return allChunks.map(({ spanName, attrs }, i) => (
                    <div key={i} className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        From: {spanName}
                      </p>
                      <RetrieverChunks attributes={attrs} />
                    </div>
                  ));
                })()}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
