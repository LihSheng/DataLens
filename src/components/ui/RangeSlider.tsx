interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValue?: boolean;
  formatValue?: (v: number) => string;
  disabled?: boolean;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  showValue = false,
  formatValue,
  disabled = false,
}: RangeSliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className="text-sm font-medium text-foreground">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm text-muted-foreground font-mono">
              {displayValue}
            </span>
          )}
        </div>
      )}
      <div className="relative w-full flex items-center">
        <input
          type="range"
          aria-label={label ?? "Range slider"}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={[
            "w-full h-2 rounded-full appearance-none cursor-pointer",
            "bg-muted",
            " [&::-webkit-slider-thumb]:appearance-none",
            " [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
            " [&::-webkit-slider-thumb]:rounded-full",
            " [&::-webkit-slider-thumb]:bg-primary",
            " [&::-webkit-slider-thumb]:cursor-pointer",
            " [&::-webkit-slider-thumb]:transition-transform",
            " [&::-webkit-slider-thumb]:duration-150",
            " [&::-webkit-slider-thumb]:shadow",
            " [&::-webkit-slider-thumb]:hover:scale-110",
            " [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
            " [&::-moz-range-thumb]:rounded-full",
            " [&::-moz-range-thumb]:bg-primary",
            " [&::-moz-range-thumb]:border-0",
            " [&::-moz-range-thumb]:cursor-pointer",
            " [&::-moz-range-thumb]:transition-transform",
            " [&::-moz-range-thumb]:duration-150",
            " [&::-moz-range-thumb]:shadow",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">{min}</span>
        <span className="text-xs text-muted-foreground">{max}</span>
      </div>
    </div>
  );
}
