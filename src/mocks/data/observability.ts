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
