import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";

interface TraceLinkProps {
  traceId: string;
  className?: string;
}

function shortenTraceId(id: string): string {
  // Show first 8 + last 4 chars for readability
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function TraceLink({ traceId, className = "" }: TraceLinkProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <Link
      to={`/traces?traceId=${traceId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60 ${className}`}
      title={`Trace: ${traceId}`}
    >
      <ExternalLink className="h-3 w-3" />
      {shortenTraceId(traceId)}
    </Link>
  );
}
