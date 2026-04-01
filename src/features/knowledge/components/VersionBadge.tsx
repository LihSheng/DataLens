interface VersionBadgeProps {
  version: number;
}

export function VersionBadge({ version }: VersionBadgeProps) {
  if (version <= 1) return null;
  return (
    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
      v{version}
    </span>
  );
}
