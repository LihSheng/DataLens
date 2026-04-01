import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Loader } from "../../../components/Loader";

interface ConversationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function ConversationSearchInput({
  value,
  onChange,
  isLoading,
}: ConversationSearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when expanded
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (v && !isExpanded) setIsExpanded(true);
  };

  const handleClear = () => {
    onChange("");
    setIsExpanded(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (value) setIsExpanded(true);
  };

  return (
    <div className="px-2 py-1.5">
      <div className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1.5 transition-all focus-within:border-primary focus-within:bg-background">
        {isLoading ? (
          <Loader
            variant="spinner"
            className="h-3 w-3 shrink-0 text-muted-foreground"
          />
        ) : (
          <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Search conversations..."
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
        />
        {value && (
          <button
            onClick={handleClear}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
