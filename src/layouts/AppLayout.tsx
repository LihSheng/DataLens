import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { useUIStore } from "../store/uiStore";
import { cn } from "../lib/utils";

export function AppLayout() {
  const { isSidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "min-h-screen transition-all duration-200",
          isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        <Header />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
