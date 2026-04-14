import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { onCLS, onLCP, onINP } from "web-vitals";

import { queryClient } from "./lib/queryClient";
import { useUIStore } from "./store/uiStore";
import { AppLayout } from "./layouts/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { Loader } from "./components/Loader";
import { Toast } from "./components/ui/Toast";
import { useAuthStore } from "./features/auth/store";
import { config } from "./lib/config";
import { httpClient } from "./services/httpClient";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const ChatPage = lazy(() =>
  import("./pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const KnowledgeBasePage = lazy(() =>
  import("./pages/KnowledgeBasePage").then((m) => ({
    default: m.KnowledgeBasePage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const SharedConversationPage = lazy(() =>
  import("./pages/SharedConversationPage").then((m) => ({
    default: m.SharedConversationPage,
  })),
);
const ObservabilityPage = lazy(() =>
  import("./pages/ObservabilityPage").then((m) => ({
    default: m.ObservabilityPage,
  })),
);
const UserManagementPage = lazy(() =>
  import("./pages/UserManagementPage").then((m) => ({
    default: m.UserManagementPage,
  })),
);

// ─── Sentry ─────────────────────────────────────────────────────────────────

if (config.appEnv === "production" && config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.appEnv,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// ─── Web Vitals ─────────────────────────────────────────────────────────────

interface VitalMetric {
  name: "CLS" | "LCP" | "FID" | "INP";
  value: number;
  id: string;
  delta: number;
  rating: "good" | "needs-improvement" | "poor";
}

function reportVital({ name, value, id }: VitalMetric) {
  const displayName = name === "INP" ? "FID" : name;
  const label = `${displayName}: ${Math.round(name === "CLS" ? value * 1000 : value)}`;
  if (config.appEnv === "production" && config.sentryDsn) {
    Sentry.addBreadcrumb({ message: label, level: "info" });
  } else {
    console.log(`[Web Vitals] ${label} (id=${id})`);
  }
}

onCLS(reportVital);
onLCP(reportVital);
onINP(reportVital);

// ─── AuthGuard ──────────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ─── Global Error Boundary ──────────────────────────────────────────────────

interface GlobalErrorBoundaryState {
  hasError: boolean;
}

export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  GlobalErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (config.appEnv === "production" && config.sentryDsn) {
      Sentry.captureException(error, {
        extra: { componentStack: info.componentStack },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              An unexpected error occurred. The page has been reset.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Per-route Error Boundary ───────────────────────────────────────────────

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  RouteErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (config.appEnv === "production" && config.sentryDsn) {
      Sentry.captureException(error, {
        extra: { componentStack: info.componentStack },
      });
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load this page
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Focus Management ───────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/": "Knowledge Assistant",
  "/knowledge-base": "Knowledge Base",
  "/settings": "Settings",
  "/observability": "Observability",
  "/users": "User Management",
};

function FocusManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = PAGE_TITLES[pathname] ?? "RAG Assistant";
    document.title = title;

    // Move focus to main content on route change for accessibility
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) {
      main.focus();
    }
  }, [pathname]);

  return null;
}

// ─── Routes (wrapped by Sentry for instrumentation) ─────────────────────────

function RoutesComponent() {
  return (
    <Suspense fallback={<Loader className="h-screen" />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route
            path="/"
            element={
              <RouteErrorBoundary>
                <ChatPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <RouteErrorBoundary>
                <KnowledgeBasePage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/settings"
            element={
              <RouteErrorBoundary>
                <SettingsPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/observability"
            element={
              <RouteErrorBoundary>
                <ObservabilityPage />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/users"
            element={
              <RouteErrorBoundary>
                <UserManagementPage />
              </RouteErrorBoundary>
            }
          />
        </Route>

        <Route
          path="/share/:token"
          element={
            <RouteErrorBoundary>
              <SharedConversationPage />
            </RouteErrorBoundary>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

const SentryRoutes =
  config.appEnv === "production" && config.sentryDsn
    ? Sentry.withSentryReactRouterV6Routing(RoutesComponent)
    : RoutesComponent;

// ─── AppRoutes ──────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <>
      <FocusManager />
      <SentryRoutes />
    </>
  );
}

// ─── App root ───────────────────────────────────────────────────────────────

export default function App() {
  const { isDarkMode } = useUIStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s._setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!accessToken) return;
    httpClient
      .get("/api/me")
      .then((res) => setUser(res.data))
      .catch(() => logout());
  }, [accessToken, setUser, logout]);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className={isDarkMode ? "dark" : ""}>
            <AppRoutes />
            <Toast />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
