import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  title?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  destructive: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  outline: "border border-border text-foreground",
};

export function Badge({
  variant = "default",
  children,
  className = "",
  title,
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className,
      ].join(" ")}
      title={title}
    >
      {children}
    </span>
  );
}
