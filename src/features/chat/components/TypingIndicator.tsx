export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="flex h-2 w-2 items-center justify-center">
        <span className="absolute h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="absolute h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="absolute h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      <span className="sr-only">Assistant is typing…</span>
    </div>
  );
}
