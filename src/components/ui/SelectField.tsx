import { useId } from "react";

interface SelectFieldProps {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  disabled?: boolean;
  helperText?: string;
}

export function SelectField({
  label,
  id: idProp,
  value,
  onChange,
  options,
  error,
  disabled,
  helperText,
}: SelectFieldProps) {
  const generatedId = useId();
  const id = idProp ?? `select-${generatedId}`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={[
          "w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-red-500" : "border-input",
        ].join(" ")}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
