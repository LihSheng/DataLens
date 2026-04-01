import type { ReactNode } from "react";

interface HelpTooltipProps {
  content: string;
  children?: ReactNode;
}

export function HelpTooltip({ content, children }: HelpTooltipProps) {
  return (
    <span className="relative group inline-flex items-center">
      {children ?? (
        <span className="text-muted-foreground cursor-help text-xs">?</span>
      )}
      <span className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50 w-56 rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-sm">
        {content}
      </span>
    </span>
  );
}
