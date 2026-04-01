import { create } from "zustand";
import { persist } from "zustand/middleware";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

interface UIState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isConversationsDrawerOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  isDarkMode: boolean;
  isSourcePanelOpen: boolean;
  highlightedSourceId: string | null;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  toggleConversationsDrawer: () => void;
  setActiveModal: (modal: string | null) => void;
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
  toggleDarkMode: () => void;
  toggleSourcePanel: () => void;
  setHighlightedSourceId: (id: string | null) => void;
  resetSettings: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isSidebarCollapsed: false,
      isConversationsDrawerOpen: false,
      activeModal: null,
      toasts: [],
      isDarkMode: localStorage.getItem("theme") === "dark",
      isSourcePanelOpen: false,
      highlightedSourceId: null,

      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      toggleSidebarCollapse: () =>
        set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      toggleConversationsDrawer: () =>
        set((s) => ({
          isConversationsDrawerOpen: !s.isConversationsDrawerOpen,
        })),
      setActiveModal: (modal) => set({ activeModal: modal }),
      addToast: (message, type = "info") =>
        set((s) => ({
          toasts: [...s.toasts, { id: Date.now().toString(), message, type }],
        })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.isDarkMode;
          if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
          }
          return { isDarkMode: next };
        }),
      toggleSourcePanel: () =>
        set((s) => ({ isSourcePanelOpen: !s.isSourcePanelOpen })),
      setHighlightedSourceId: (id) => set({ highlightedSourceId: id }),
      resetSettings: () =>
        set({ isSourcePanelOpen: false, highlightedSourceId: null }),
    }),
    {
      name: "ui-store",
      partialize: (s) => ({
        isSidebarCollapsed: s.isSidebarCollapsed,
        isDarkMode: s.isDarkMode,
      }),
    },
  ),
);
