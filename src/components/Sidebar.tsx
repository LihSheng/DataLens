import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  LogOut,
  BarChart2,
} from "lucide-react";
import { useUIStore } from "../store/uiStore";
import { useAuthStore } from "../features/auth/store";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: MessageSquare, label: "Chat" },
  { to: "/knowledge-base", icon: Database, label: "Knowledge Base" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const {
    isSidebarOpen,
    isSidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapse,
  } = useUIStore();

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const ALL_NAV_ITEMS = [
    ...NAV_ITEMS,
    ...(isAdmin
      ? [{ to: "/observability", icon: BarChart2, label: "Observability" }]
      : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-full flex-col border-r bg-card transition-all duration-200",
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "w-16" : "w-64",
          "lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">RAG Assistant</span>
              <span className="text-xs text-muted-foreground">
                Knowledge Q&amp;A
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2">
          {ALL_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isSidebarCollapsed && "justify-center px-2",
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isSidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout button */}
        <div className="border-t p-2">
          <button
            onClick={() => useAuthStore.getState().logout()}
            aria-label="Log out"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!isSidebarCollapsed && <span>Log out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <div className="hidden border-t p-2 lg:block">
          <button
            onClick={toggleSidebarCollapse}
            aria-label={
              isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
