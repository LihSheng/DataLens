import { X } from "lucide-react";

interface FilterChip {
  id: string;
  label: string;
}

interface FilterChipGroupProps {
  label?: string;
  chips: FilterChip[];
  onRemove?: (id: string) => void;
}

export function FilterChipGroup({
  label,
  chips,
  onRemove,
}: FilterChipGroupProps) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground"
        >
          {chip.label}
          {onRemove && (
            <button
              onClick={() => onRemove(chip.id)}
              className="ml-0.5 rounded-full hover:bg-muted"
              aria-label={`Remove ${chip.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
