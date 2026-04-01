// ─── Observability Types ───────────────────────────────────────────────────

export type UserRole = "admin" | "user";

export interface EvaluationRun {
  traceId: string;
  question: string;
  lastScore: number;
  threshold: number;
  passed: boolean;
  evaluatedAt: string;
}

export interface EvaluationResult {
  traceId: string;
  question: string;
  expectedAnswer: string;
  actualScore: number;
  threshold: number;
  passed: boolean;
  evaluatedAt: string;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  positiveRatio: number;
  negativeRatio: number;
  trend: "up" | "down" | "stable";
}

export interface CostSummary {
  totalSpendUSD: number;
  periodDays: number;
  byModel: ModelCost[];
  byUser: UserCost[];
}

export interface ModelCost {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}

export interface UserCost {
  userId: string;
  userName: string;
  requests: number;
  costUSD: number;
}

export interface AuditEvent {
  id: string;
  userId: string;
  userName: string;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
}

export interface AuditFilters {
  userId?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditEvents {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
