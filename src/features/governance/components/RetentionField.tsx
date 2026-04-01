import type { RAGSettings } from "../../../types";

interface RetentionFieldProps {
  value: RAGSettings["conversationRetentionDays"];
  onChange: (value: number) => void;
  error?: string;
}

export function RetentionField({
  value,
  onChange,
  error,
}: RetentionFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="conversationRetentionDays"
        className="text-sm font-medium text-foreground"
      >
        Conversation retention (days)
      </label>
      <input
        id="conversationRetentionDays"
        type="number"
        min={1}
        max={365}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 30)}
        className={[
          "w-24 h-10 px-3 rounded-md border bg-background text-sm text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          error ? "border-red-500" : "border-input",
        ].join(" ")}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Conversations older than this will be automatically deleted.
      </p>
    </div>
  );
}
