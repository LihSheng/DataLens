import {
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import { Send } from "lucide-react";

export interface ChatInputHandle {
  focus: () => void;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  ({ onSend, disabled, isStreaming }, ref) => {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    // Global Cmd/Ctrl+K shortcut to focus the input
    useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          textareaRef.current?.focus();
        }
      };
      document.addEventListener("keydown", handleGlobalKeyDown);
      return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Cmd/Ctrl+K: focus (already handled globally, but keep for when textarea is focused)
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          textareaRef.current?.focus();
          return;
        }
        // Enter without modifier: send
        if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          if (value.trim() && !disabled && !isStreaming) {
            onSend(value.trim());
            setValue("");
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
            }
            textareaRef.current?.focus();
          }
        }
        // Shift+Enter: allow newline (default textarea behavior)
      },
      [value, disabled, isStreaming, onSend],
    );

    const handleSend = () => {
      if (value.trim() && !disabled && !isStreaming) {
        onSend(value.trim());
        setValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        textareaRef.current?.focus();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };

    const canSend = value.trim().length > 0 && !disabled && !isStreaming;

    return (
      <div className="relative">
        <div className="flex items-start gap-2 rounded-xl border bg-card p-3 shadow-sm">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your documents…"
            disabled={disabled || isStreaming}
            readOnly={isStreaming}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ maxHeight: "160px" }}
            aria-label="Chat message input. Press Enter to send, Shift+Enter for new line, Cmd/Ctrl+K to focus."
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Keyboard shortcuts tooltip */}
        <div
          className="absolute right-0 top-full mt-1.5 z-10 flex items-center gap-3 rounded-md border bg-popover px-3 py-1.5 text-xs text-muted-foreground shadow-sm pointer-events-none"
          aria-hidden="true"
        >
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ↵
            </kbd>{" "}
            send
          </span>
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ⇧↵
            </kbd>{" "}
            newline
          </span>
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>{" "}
            focus
          </span>
        </div>
      </div>
    );
  },
);
