/**
 * Admin Users API — user management endpoints for admins.
 */

import { httpClient } from "./httpClient";

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: string;
  is_blocked: boolean;
  blocked_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface PaginatedUsersResponse {
  users: UserPublic[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: string;
  is_blocked?: boolean;
}

export const usersApi = {
  /**
   * List all users (admin only)
   */
  listUsers: async (
    params?: UserListParams,
  ): Promise<PaginatedUsersResponse> => {
    const res = await httpClient.get<PaginatedUsersResponse>(
      "/api/admin/users",
      {
        params,
      },
    );
    return res.data;
  },

  /**
   * Block a user (admin only)
   */
  blockUser: async (
    userId: string,
    reason?: string,
  ): Promise<{ user_id: string; is_blocked: boolean; blocked_at: string }> => {
    const res = await httpClient.post<{
      user_id: string;
      is_blocked: boolean;
      blocked_at: string;
    }>(`/api/admin/users/${userId}/block`, reason ? { reason } : {});
    return res.data;
  },

  /**
   * Unblock a user (admin only)
   */
  unblockUser: async (
    userId: string,
  ): Promise<{ user_id: string; is_blocked: boolean }> => {
    const res = await httpClient.post<{ user_id: string; is_blocked: boolean }>(
      `/api/admin/users/${userId}/unblock`,
    );
    return res.data;
  },

  /**
   * Update user role (admin only)
   */
  updateRole: async (
    userId: string,
    role: "admin" | "user",
  ): Promise<{ user_id: string; role: string; updated_at: string }> => {
    const res = await httpClient.patch<{
      user_id: string;
      role: string;
      updated_at: string;
    }>(`/api/admin/users/${userId}/role`, { role });
    return res.data;
  },
};
