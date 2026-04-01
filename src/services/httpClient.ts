/**
 * httpClient — Axios instance with auth interceptors.
 *
 * • Injects `Authorization: Bearer <token>` on every outbound request.
 * • 401 responses clear auth state and redirect to /login.
 * • Token-refresh stub is wired for future use.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../features/auth/store";
import { config } from "../lib/config";

// ─── Axios instance ─────────────────────────────────────────────────────────

export const httpClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: attach Bearer token ──────────────────────────────

httpClient.interceptors.request.use((reqConfig: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && reqConfig.headers) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

// ─── Response interceptor: 401 → clear auth + redirect ────────────────────

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();

      // Only redirect if we were actually authenticated (avoid redirect loops on /login)
      if (authStore.isAuthenticated) {
        authStore.logout();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// ─── Token refresh stub ─────────────────────────────────────────────────────
// TODO: implement POST /api/auth/refresh with the refresh token from the httpOnly cookie
// export const refreshToken = async (refreshToken: string) => { ... }
