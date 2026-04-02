interface LoaderProps {
  variant?: "spinner" | "skeleton";
  className?: string;
}

export function Loader({ variant = "spinner", className = "" }: LoaderProps) {
  if (variant === "skeleton") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
    </div>
  );
}
