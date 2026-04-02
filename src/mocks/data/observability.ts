import type {
  EvaluationRun,
  FeedbackStats,
  CostSummary,
  AuditEvent,
} from "../../types/observability";

// ─── Evaluation Mock Data ─────────────────────────────────────────────────

export const MOCK_EVALUATION_RUNS: EvaluationRun[] = [
  {
    traceId: "eval_001",
    question: "What is the capital of France?",
    lastScore: 0.95,
    threshold: 0.8,
    passed: true,
    evaluatedAt: "2026-03-28T10:00:00Z",
  },
  {
    traceId: "eval_002",
    question: "How do I reset my password?",
    lastScore: 0.72,
    threshold: 0.8,
    passed: false,
    evaluatedAt: "2026-03-28T10:00:00Z",
  },
  {
    traceId: "eval_003",
    question: "What are the subscription plans?",
    lastScore: 0.88,
    threshold: 0.8,
    passed: true,
    evaluatedAt: "2026-03-29T14:30:00Z",
  },
  {
    traceId: "eval_004",
    question: "Can I export my data?",
    lastScore: 0.91,
    threshold: 0.8,
    passed: true,
    evaluatedAt: "2026-03-29T14:30:00Z",
  },
  {
    traceId: "eval_005",
    question: "What is the refund policy?",
    lastScore: 0.65,
    threshold: 0.8,
    passed: false,
    evaluatedAt: "2026-03-30T09:15:00Z",
  },
  {
    traceId: "eval_006",
    question: "How do I contact support?",
    lastScore: 0.93,
    threshold: 0.8,
    passed: true,
    evaluatedAt: "2026-03-30T09:15:00Z",
  },
];

// ─── Feedback Mock Data ────────────────────────────────────────────────────

export const MOCK_FEEDBACK_STATS: FeedbackStats = {
  total: 1247,
  positive: 892,
  negative: 355,
  positiveRatio: 0.715,
  negativeRatio: 0.285,
  trend: "up",
};

// ─── Cost Mock Data ───────────────────────────────────────────────────────

export const MOCK_COST_SUMMARY: CostSummary = {
  totalSpendUSD: 4827.34,
  periodDays: 30,
  byModel: [
    {
      model: "gpt-4o-mini",
      requests: 8421,
      inputTokens: 2_450_000,
      outputTokens: 1_120_000,
      costUSD: 1823.5,
    },
    {
      model: "gpt-4o",
      requests: 1203,
      inputTokens: 890_000,
      outputTokens: 445_000,
      costUSD: 2156.8,
    },
    {
      model: "text-embedding-3-large",
      requests: 5230,
      inputTokens: 1_050_000,
      outputTokens: 0,
      costUSD: 847.04,
    },
  ],
  byUser: [
    {
      userId: "usr_1",
      userName: "Alice Chen",
      requests: 3210,
      costUSD: 1654.2,
    },
    {
      userId: "usr_2",
      userName: "Bob Martinez",
      requests: 2180,
      costUSD: 1234.5,
    },
    {
      userId: "usr_3",
      userName: "Carol Johnson",
      requests: 1540,
      costUSD: 987.3,
    },
    { userId: "usr_4", userName: "David Lee", requests: 980, costUSD: 512.4 },
    { userId: "usr_5", userName: "Eve Davis", requests: 720, costUSD: 438.94 },
  ],
};

// ─── Audit Mock Data ───────────────────────────────────────────────────────

const EVENT_TYPES = [
  "auth.login",
  "auth.logout",
  "chat.message_sent",
  "chat.message_feedback",
  "document.uploaded",
  "document.deleted",
  "document.reindexed",
  "settings.updated",
  "evaluation.run",
  "audit.exported",
];

function randomIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

const MOCK_USERS = [
  { id: "usr_1", name: "Alice Chen" },
  { id: "usr_2", name: "Bob Martinez" },
  { id: "usr_3", name: "Carol Johnson" },
  { id: "usr_4", name: "David Lee" },
  { id: "usr_5", name: "Eve Davis" },
];

function generateAuditEvents(count: number): AuditEvent[] {
  const events: AuditEvent[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    const eventType =
      EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const timestamp = new Date(
      now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    ).toISOString();
    events.push({
      id: `audit_${String(i + 1).padStart(5, "0")}`,
      userId: user.id,
      userName: user.name,
      eventType,
      description: `${eventType.replace(".", " ").replace("_", " ")} by ${user.name}`,
      metadata:
        eventType === "chat.message_sent"
          ? { tokens: Math.floor(Math.random() * 500) + 50 }
          : undefined,
      ipAddress: randomIp(),
      timestamp,
    });
  }
  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export const MOCK_AUDIT_EVENTS = generateAuditEvents(200);

export function getAuditEvents(filters: {
  userId?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const {
    userId,
    eventType,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
  } = filters;

  let filtered = [...MOCK_AUDIT_EVENTS];

  if (userId) {
    filtered = filtered.filter((e) => e.userId === userId);
  }
  if (eventType) {
    filtered = filtered.filter((e) => e.eventType === eventType);
  }
  if (dateFrom) {
    filtered = filtered.filter((e) => e.timestamp >= dateFrom);
  }
  if (dateTo) {
    filtered = filtered.filter((e) => e.timestamp <= dateTo);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const events = filtered.slice(start, start + pageSize);

  return { events, total, page, pageSize, totalPages };
}

// ─── Phoenix / Traces Mock Data ────────────────────────────────────────────

/** Mock trace list in Phoenix v4 format (snake_case fields) */
export const MOCK_TRACES: Record<string, object>[] = [
  {
    trace_id: "trace_001abc1def",
    start_time: "2026-04-02T08:30:00.000Z",
    end_time: "2026-04-02T08:30:00.850Z",
    latency_ms: 850,
    num_spans: 5,
  },
  {
    trace_id: "trace_002abc2def",
    start_time: "2026-04-02T08:31:00.000Z",
    end_time: "2026-04-02T08:31:01.200Z",
    latency_ms: 1200,
    num_spans: 6,
  },
  {
    trace_id: "trace_003abc3def",
    start_time: "2026-04-02T08:32:00.000Z",
    end_time: "2026-04-02T08:32:00.520Z",
    latency_ms: 520,
    num_spans: 4,
  },
  {
    trace_id: "trace_004abc4def",
    start_time: "2026-04-02T08:35:00.000Z",
    end_time: "2026-04-02T08:35:02.100Z",
    latency_ms: 2100,
    num_spans: 7,
  },
  {
    trace_id: "trace_005abc5def",
    start_time: "2026-04-02T08:40:00.000Z",
    end_time: "2026-04-02T08:40:00.730Z",
    latency_ms: 730,
    num_spans: 5,
  },
];

/** Mock spans for trace_001abc1def — Phoenix v4 format */
export const MOCK_SPANS_TRACE_001: Record<string, unknown>[] = [
  {
    span_id: "span_root_001",
    parent_id: undefined,
    display_name: "rag_request",
    start_time: "2026-04-02T08:30:00.000Z",
    end_time: "2026-04-02T08:30:00.850Z",
    duration: 850_000_000, // nanoseconds
    status_code: 0, // ok
    attributes: {
      user_id: "usr_1",
      conversation_id: "conv_sample",
      query_length: 42,
      retrieved_chunks: 8,
      reranked_chunks: 4,
      model: "gpt-4o-mini",
    },
  },
  {
    span_id: "span_hybrid_001",
    parent_id: "span_root_001",
    display_name: "hybrid_retrieval",
    start_time: "2026-04-02T08:30:00.050Z",
    end_time: "2026-04-02T08:30:00.200Z",
    duration: 150_000_000,
    status_code: 0,
    attributes: {
      chunks_returned: 8,
      vector_weight: 0.7,
      bm25_weight: 0.3,
    },
  },
  {
    span_id: "span_rerank_001",
    parent_id: "span_root_001",
    display_name: "cross_encoder_rerank",
    start_time: "2026-04-02T08:30:00.210Z",
    end_time: "2026-04-02T08:30:00.320Z",
    duration: 110_000_000,
    status_code: 0,
    attributes: {
      model: "BAAI/bge-reranker-base",
      input_docs: 8,
      output_docs: 4,
      top_score: 0.94,
    },
  },
  {
    span_id: "span_context_001",
    parent_id: "span_root_001",
    display_name: "context_assembly",
    start_time: "2026-04-02T08:30:00.330Z",
    end_time: "2026-04-02T08:30:00.380Z",
    duration: 50_000_000,
    status_code: 0,
    attributes: {
      chunks_used: 4,
      tokens_used: 1420,
      token_budget: 1800,
    },
  },
  {
    span_id: "span_llm_001",
    parent_id: "span_root_001",
    display_name: "llm_generation",
    start_time: "2026-04-02T08:30:00.390Z",
    end_time: "2026-04-02T08:30:00.850Z",
    duration: 460_000_000,
    status_code: 0,
    attributes: {
      model: "gpt-4o-mini",
      input_tokens: 1420,
      output_tokens: 380,
      cost_usd: 0.0023,
    },
  },
];

/** Mock spans for trace_004abc4def (slow/large trace) */
export const MOCK_SPANS_TRACE_004: Record<string, unknown>[] = [
  {
    span_id: "span_root_004",
    parent_id: undefined,
    display_name: "rag_request",
    start_time: "2026-04-02T08:35:00.000Z",
    end_time: "2026-04-02T08:35:02.100Z",
    duration: 2_100_000_000,
    status_code: 2, // error
    attributes: {
      user_id: "usr_3",
      conversation_id: "conv_slow",
      query_length: 128,
      error: "timeout",
    },
  },
  {
    span_id: "span_hybrid_004",
    parent_id: "span_root_004",
    display_name: "hybrid_retrieval",
    start_time: "2026-04-02T08:35:00.010Z",
    end_time: "2026-04-02T08:35:01.200Z",
    duration: 1_190_000_000,
    status_code: 0,
    attributes: { chunks_returned: 12 },
  },
  {
    span_id: "span_llm_004",
    parent_id: "span_root_004",
    display_name: "llm_generation",
    start_time: "2026-04-02T08:35:01.300Z",
    end_time: "2026-04-02T08:35:02.100Z",
    duration: 800_000_000,
    status_code: 2,
    attributes: { error: "model_timeout" },
  },
];

/** Mock eval scores for trace_001abc1def — Phoenix v4 format */
export const MOCK_EVALS_TRACE_001: Record<string, unknown>[] = [
  {
    name: "Faithfulness",
    label: 0.92,
    score: 0.92,
    metric_name: "faithfulness",
  },
  {
    name: "Answer Relevance",
    label: 0.88,
    score: 0.88,
    metric_name: "answer_relevance",
  },
  {
    name: "Context Precision",
    label: 0.95,
    score: 0.95,
    metric_name: "context_precision",
  },
  { name: "Human Feedback", label: "positive", metric_name: "human_feedback" },
];

/** Mock summary response */
export const MOCK_PHOENIX_SUMMARY = {
  total_traces: 127,
  total_spans: 843,
  avg_latency_ms: 780,
  error_rate: 0.08,
  traces_last_24h: 38,
};
