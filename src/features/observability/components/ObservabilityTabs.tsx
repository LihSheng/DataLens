import {
  BarChart2,
  MessageSquare,
  DollarSign,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { cn } from "../../../lib/utils";

export type ObservabilityTab =
  | "evaluation"
  | "feedback"
  | "cost"
  | "audit"
  | "traces";

interface TabItem {
  id: ObservabilityTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: "evaluation", label: "Evaluation", icon: BarChart2 },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "cost", label: "Cost", icon: DollarSign },
  { id: "audit", label: "Audit Log", icon: ShieldAlert },
  { id: "traces", label: "Traces", icon: Activity },
];

interface ObservabilityTabsProps {
  activeTab: ObservabilityTab;
  onTabChange: (tab: ObservabilityTab) => void;
}

export function ObservabilityTabs({
  activeTab,
  onTabChange,
}: ObservabilityTabsProps) {
  return (
    <div className="flex gap-1 border-b px-6">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
