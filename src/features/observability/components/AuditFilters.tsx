import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { AuditFilters } from "../../../types/observability";

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All event types" },
  { value: "auth.login", label: "auth.login" },
  { value: "auth.logout", label: "auth.logout" },
  { value: "chat.message_sent", label: "chat.message_sent" },
  { value: "chat.message_feedback", label: "chat.message_feedback" },
  { value: "document.uploaded", label: "document.uploaded" },
  { value: "document.deleted", label: "document.deleted" },
  { value: "document.reindexed", label: "document.reindexed" },
  { value: "settings.updated", label: "settings.updated" },
  { value: "evaluation.run", label: "evaluation.run" },
  { value: "audit.exported", label: "audit.exported" },
];

export interface AuditFiltersProps {
  filters: AuditFilters;
  onFiltersChange: (filters: AuditFilters) => void;
}

export function AuditFilters({ filters, onFiltersChange }: AuditFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AuditFilters>(filters);

  function apply() {
    onFiltersChange({ ...localFilters, page: 1 });
  }

  function clear() {
    const cleared: AuditFilters = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  }

  function handleChange(field: keyof AuditFilters, value: string) {
    setLocalFilters((prev) => ({ ...prev, [field]: value || undefined }));
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      {/* User filter */}
      <div className="flex flex-col gap-1 min-w-[160px]">
        <label className="text-xs text-muted-foreground" htmlFor="filter-user">
          User
        </label>
        <input
          id="filter-user"
          type="text"
          placeholder="Filter by user…"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={localFilters.userId ?? ""}
          onChange={(e) => handleChange("userId", e.target.value)}
        />
      </div>

      {/* Event type filter */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <label
          className="text-xs text-muted-foreground"
          htmlFor="filter-event-type"
        >
          Event Type
        </label>
        <select
          id="filter-event-type"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={localFilters.eventType ?? ""}
          onChange={(e) => handleChange("eventType", e.target.value)}
        >
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date from */}
      <div className="flex flex-col gap-1 min-w-[150px]">
        <label
          className="text-xs text-muted-foreground"
          htmlFor="filter-date-from"
        >
          From
        </label>
        <input
          id="filter-date-from"
          type="date"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={localFilters.dateFrom?.split("T")[0] ?? ""}
          onChange={(e) =>
            handleChange(
              "dateFrom",
              e.target.value ? `${e.target.value}T00:00:00Z` : "",
            )
          }
        />
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1 min-w-[150px]">
        <label
          className="text-xs text-muted-foreground"
          htmlFor="filter-date-to"
        >
          To
        </label>
        <input
          id="filter-date-to"
          type="date"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={localFilters.dateTo?.split("T")[0] ?? ""}
          onChange={(e) =>
            handleChange(
              "dateTo",
              e.target.value ? `${e.target.value}T23:59:59Z` : "",
            )
          }
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={apply} className="gap-1.5">
          <Search className="h-3.5 w-3.5" />
          Search
        </Button>
        <Button size="sm" variant="ghost" onClick={clear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
