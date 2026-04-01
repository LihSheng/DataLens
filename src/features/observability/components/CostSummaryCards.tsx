import { DollarSign, Cpu, Users } from "lucide-react";
import type { CostSummary } from "../../../types/observability";

interface CostSummaryCardsProps {
  summary: CostSummary | undefined;
  isLoading?: boolean;
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function CostSummaryCards({
  summary,
  isLoading,
}: CostSummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border bg-card p-4"
            >
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="h-6 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total spend */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Spend</p>
            <p className="text-xl font-semibold">
              {formatUSD(summary.totalSpendUSD)}
            </p>
            <p className="text-xs text-muted-foreground">
              Last {summary.periodDays} days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Top Model</p>
            <p className="text-sm font-medium truncate">
              {summary.byModel.sort((a, b) => b.costUSD - a.costUSD)[0]
                ?.model ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.byModel.length} models used
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Top User</p>
            <p className="text-sm font-medium truncate">
              {summary.byUser.sort((a, b) => b.costUSD - a.costUSD)[0]
                ?.userName ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.byUser.length} users tracked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Requests</p>
            <p className="text-xl font-semibold">
              {summary.byModel
                .reduce((sum, m) => sum + m.requests, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Cost by model table */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Cost by Model</h3>
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Model</th>
                <th className="px-4 py-3 text-right font-medium">Requests</th>
                <th className="px-4 py-3 text-right font-medium">
                  Input Tokens
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Output Tokens
                </th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summary.byModel.map((row) => (
                <tr
                  key={row.model}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{row.model}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {row.requests.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatTokens(row.inputTokens)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatTokens(row.outputTokens)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatUSD(row.costUSD)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost by user table */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Cost by User</h3>
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-right font-medium">Requests</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-right font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summary.byUser.map((row) => (
                <tr
                  key={row.userId}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{row.userName}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {row.requests.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatUSD(row.costUSD)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {((row.costUSD / summary.totalSpendUSD) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
