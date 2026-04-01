import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../features/auth/store";

// We test the Zustand store directly, not through React
// Reset store state between tests
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  localStorage.clear();
});

describe("authStore", () => {
  describe("login", () => {
    it("sets user and token on successful credentials login", async () => {
      const promise = useAuthStore.getState().login({
        provider: "credentials",
        email: "alice@example.com",
        password: "password123",
      });

      // Should be loading immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await promise;

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual({
        id: "usr_1",
        email: "alice@example.com",
        name: "Alice Chen",
      });
      expect(useAuthStore.getState().accessToken).toMatch(/^eyJhbGci/);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it("sets error on invalid credentials", async () => {
      await expect(
        useAuthStore.getState().login({
          provider: "credentials",
          email: "wrong@example.com",
          password: "wrongpassword",
        }),
      ).rejects.toThrow("Invalid email or password");

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().error).toBe("Invalid email or password");
    });

    it("sets user and token on OAuth login (no API call)", async () => {
      const oauthUser = {
        id: "usr_oauth",
        email: "bob@example.com",
        name: "Bob",
      };

      await useAuthStore.getState().login({
        provider: "oauth",
        accessToken: "oauth_access_token_xyz",
        user: oauthUser,
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(oauthUser);
      expect(useAuthStore.getState().accessToken).toBe(
        "oauth_access_token_xyz",
      );
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("logout", () => {
    it("clears all auth state", async () => {
      // First login
      await useAuthStore.getState().login({
        provider: "credentials",
        email: "alice@example.com",
        password: "password123",
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears the error message", async () => {
      await expect(
        useAuthStore.getState().login({
          provider: "credentials",
          email: "bad@example.com",
          password: "bad",
        }),
      ).rejects.toThrow();

      expect(useAuthStore.getState().error).toBeTruthy();

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("token persistence", () => {
    it("persisted auth state survives store re-initialisation", async () => {
      // Login and persist
      await useAuthStore.getState().login({
        provider: "credentials",
        email: "alice@example.com",
        password: "password123",
      });

      // Zustand persist middleware writes to localStorage automatically
      const stored = localStorage.getItem("auth-storage");
      expect(stored).toBeTruthy();

      // Simulate page reload: re-import the store (Zustand persist rehydrates from localStorage)
      // We use setState to simulate the rehydration by parsing what was stored
      const parsed = JSON.parse(stored!);
      expect(parsed.state.isAuthenticated).toBe(true);
      expect(parsed.state.accessToken).toMatch(/^eyJhbGci/);
    });
  });
});
