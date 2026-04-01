import { create } from "zustand";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  durationMs: number;
};

interface UIState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isConversationsDrawerOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  isDarkMode: boolean;
  sourcePanel: {
    isOpen: boolean;
    highlightedSourceId: string | null;
  };
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  toggleConversationsDrawer: () => void;
  openModal: (modal: string | null) => void;
  closeModal: () => void;
  pushToast: (toast: Omit<Toast, "id"> & { durationMs?: number }) => string;
  dismissToast: (id: string) => void;
  toggleDarkMode: () => void;
  openSourcePanel: (highlightedId?: string) => void;
  closeSourcePanel: () => void;
  highlightSource: (sourceId: string | null) => void;
  resetSettings: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  isConversationsDrawerOpen: false,
  activeModal: null,
  toasts: [],
  isDarkMode: localStorage.getItem("theme") === "dark",
  sourcePanel: {
    isOpen: false,
    highlightedSourceId: null,
  },

  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  toggleSidebarCollapse: () =>
    set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  toggleConversationsDrawer: () =>
    set((s) => ({
      isConversationsDrawerOpen: !s.isConversationsDrawerOpen,
    })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  pushToast: (toast) => {
    const id = Date.now().toString();
    set((s) => ({
      toasts: [
        ...s.toasts,
        {
          ...toast,
          durationMs: toast.durationMs ?? 4000,
          id,
        },
      ],
    }));
    return id;
  },
  dismissToast: (id) =>
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
  openSourcePanel: (highlightedId) =>
    set((s) => ({
      sourcePanel: {
        isOpen: true,
        highlightedSourceId: highlightedId ?? s.sourcePanel.highlightedSourceId,
      },
    })),
  closeSourcePanel: () =>
    set((s) => ({
      sourcePanel: {
        ...s.sourcePanel,
        isOpen: false,
        highlightedSourceId: null,
      },
    })),
  highlightSource: (sourceId) =>
    set((s) => ({
      sourcePanel: { ...s.sourcePanel, highlightedSourceId: sourceId },
    })),
  resetSettings: () =>
    set((s) => ({
      sourcePanel: {
        ...s.sourcePanel,
        isOpen: false,
        highlightedSourceId: null,
      },
    })),
}));
