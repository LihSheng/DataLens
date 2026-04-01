import { useState } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import type {
  AuditEvent,
  PaginatedAuditEvents,
} from "../../../types/observability";
import { Button } from "../../../components/ui/Button";
import { AuditFilters, type AuditFiltersProps } from "./AuditFilters";

interface AuditTableProps {
  data: PaginatedAuditEvents | undefined;
  filters: AuditFiltersProps["filters"];
  isLoading?: boolean;
  onFiltersChange: (filters: AuditFiltersProps["filters"]) => void;
  onExport: () => void;
  isExporting?: boolean;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function EventTypeBadge({ eventType }: { eventType: string }) {
  const colors: Record<string, string> = {
    "auth.login":
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "auth.logout":
      "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
    "chat.message_sent":
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "chat.message_feedback":
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    "document.uploaded":
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    "document.deleted":
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "document.reindexed":
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "settings.updated":
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "evaluation.run":
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    "audit.exported":
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };
  const colorClass = colors[eventType] ?? "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {eventType}
    </span>
  );
}

export function AuditTable({
  data,
  filters,
  isLoading,
  onFiltersChange,
  onExport,
  isExporting,
}: AuditTableProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  function handleFiltersChange(newFilters: AuditFiltersProps["filters"]) {
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }

  function handlePageChange(newPage: number) {
    onFiltersChange({ ...filters, page: newPage });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Event</th>
                <th className="px-4 py-3 text-left font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  {[0, 1, 2, 3].map((j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const events: AuditEvent[] = data?.events ?? [];
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <AuditFilters
          filters={localFilters}
          onFiltersChange={handleFiltersChange}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={onExport}
          disabled={isExporting}
          className="gap-1.5 shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          {isExporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">
            No audit events found.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Event</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateTime(event.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-medium">{event.userName}</td>
                  <td className="px-4 py-3">
                    <EventTypeBadge eventType={event.eventType} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {event.description}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {event.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages} &mdash;{" "}
            {data?.total.toLocaleString()} events
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
