import { http, HttpResponse } from "msw";
import {
  MOCK_EVALUATION_RUNS,
  MOCK_FEEDBACK_STATS,
  MOCK_COST_SUMMARY,
  getAuditEvents,
} from "../data/observability";

export const observabilityHandlers = [
  // GET /api/evaluations — list all evaluation runs
  http.get("/api/evaluations", () => {
    return HttpResponse.json({ runs: MOCK_EVALUATION_RUNS });
  }),

  // POST /api/evaluations/run — trigger a new evaluation run
  http.post("/api/evaluations/run", async () => {
    // Simulate async evaluation — in production this would queue a job
    return HttpResponse.json(
      {
        message: "Evaluation queued",
        traceId: `eval_${Date.now()}`,
        status: "queued",
      },
      { status: 202 },
    );
  }),

  // GET /api/evaluations/:trace_id — get a specific evaluation result
  http.get("/api/evaluations/:traceId", ({ params }) => {
    const { traceId } = params as { traceId: string };
    const run = MOCK_EVALUATION_RUNS.find((r) => r.traceId === traceId);
    if (!run) {
      return HttpResponse.json(
        { message: "Evaluation not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json(run);
  }),

  // GET /api/feedback/stats — get feedback statistics
  http.get("/api/feedback/stats", () => {
    return HttpResponse.json(MOCK_FEEDBACK_STATS);
  }),

  // GET /api/costs/summary — get cost summary
  http.get("/api/costs/summary", () => {
    return HttpResponse.json(MOCK_COST_SUMMARY);
  }),

  // GET /api/audit — get paginated audit events
  http.get("/api/audit", ({ request }) => {
    const url = new URL(request.url);
    const filters = {
      userId: url.searchParams.get("userId") ?? undefined,
      eventType: url.searchParams.get("eventType") ?? undefined,
      dateFrom: url.searchParams.get("dateFrom") ?? undefined,
      dateTo: url.searchParams.get("dateTo") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 20),
    };
    return HttpResponse.json(getAuditEvents(filters));
  }),

  // GET /api/audit/export — export audit log as CSV
  http.get("/api/audit/export", ({ request }) => {
    const url = new URL(request.url);
    url.searchParams.get("format"); // consume to avoid unused warning
    const { events } = getAuditEvents({ page: 1, pageSize: 200 });

    const csv = [
      "ID,User,Event Type,Description,IP Address,Timestamp",
      ...events.map(
        (e) =>
          `${e.id},"${e.userName}",${e.eventType},"${e.description}",${e.ipAddress},${e.timestamp}`,
      ),
    ].join("\n");

    return new HttpResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="audit_log.csv"',
      },
    });
  }),
];
