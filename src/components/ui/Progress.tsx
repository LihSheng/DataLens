interface ProgressProps {
  value: number;
  label?: string;
  className?: string;
}

export function Progress({
  value,
  label = "Upload progress",
  className = "",
}: ProgressProps) {
  return (
    <progress
      value={value}
      max={100}
      aria-label={label}
      className={[
        "h-2 w-full appearance-none rounded-full bg-muted [&::-webkit-progress-bar]:rounded-full",
        "[&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary",
        "[&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary",
        className,
      ].join(" ")}
    />
  );
}
