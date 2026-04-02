import { useAuthStore } from "../store";

/**
 * Convenience hook for accessing auth state.
 * Derives isAdmin from user.role.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === "admin",
  };
}
