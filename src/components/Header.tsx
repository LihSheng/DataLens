import { Moon, Sun, Menu, MessageSquare } from "lucide-react";
import { useUIStore } from "../store/uiStore";
import { useLocation } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "/": "Knowledge Assistant",
  "/knowledge-base": "Knowledge Base",
  "/settings": "Settings",
};

export function Header() {
  const {
    toggleSidebar,
    toggleDarkMode,
    isDarkMode,
    toggleConversationsDrawer,
  } = useUIStore();
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "RAG Assistant";
  const isChatPage = pathname === "/";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-6">
      {/* Nav sidebar toggle (hamburger) — hidden on lg (sidebar visible there) */}
      <button
        onClick={toggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted transition-colors lg:hidden"
        aria-label="Toggle navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {/* Conversations toggle — only on chat page, hidden at xl+ (sidebar permanently visible) */}
      {isChatPage && (
        <button
          onClick={toggleConversationsDrawer}
          className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted transition-colors xl:hidden"
          aria-label="Toggle conversations"
          title="Conversations"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      )}

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </header>
  );
}
