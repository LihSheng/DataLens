/**
 * Auth Store — Zustand slice for authentication state.
 *
 * SSO-Ready Design: login() accepts a discriminated union of credentials so that
 * a future OAuth/SAML flow can be swapped in without touching any UI code.
 *
 * JWT Storage Note:
 *   We store the token in localStorage for simplicity. In production with real
 *   sessions, prefer httpOnly cookies — they prevent XSS token theft entirely,
 *   whereas localStorage is accessible to any injected script on the page.
 *   The trade-off is documented below.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role?: "admin" | "user";
}

export interface UsernamePasswordCredentials {
  provider: "credentials";
  email: string;
  password: string;
}

export interface OAuthTokenCredentials {
  provider: "oauth";
  accessToken: string;
  user: User;
}

/** Union of all supported auth providers */
export type AuthCredentials =
  | UsernamePasswordCredentials
  | OAuthTokenCredentials;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  setToken: (token: string | null) => void;
  _setUser: (user: User | null) => void;
  clearError: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: AuthCredentials) => {
        set({ isLoading: true, error: null });

        try {
          if (credentials.provider === "credentials") {
            // Real implementation would call POST /api/auth/login
            // For now we simulate via MSW (see src/mocks/handlers/auth.ts)
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });

            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.message ?? "Invalid email or password");
            }

            const data = await res.json();
            set({
              user: data.user,
              accessToken: data.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // OAuth path — token already exchanged, just store it
            set({
              user: credentials.user,
              accessToken: credentials.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Login failed",
            isLoading: false,
          });
          throw err;
        }
      },

      logout: () => {
        // Fire-and-forget logout call so the server can invalidate the token
        fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          },
        }).catch(() => {
          // Ignore network errors — we still clear local state
        });

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setToken: (token) =>
        set({
          accessToken: token,
          isAuthenticated: !!token,
        }),

      _setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user || !!useAuthStore.getState().accessToken,
        }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({
        accessToken: s.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        const token = state?.accessToken;
        if (token) {
          state?.setToken(token);
        }
      },
    },
  ),
);
