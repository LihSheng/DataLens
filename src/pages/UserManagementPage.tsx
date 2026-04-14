import { useState } from "react";
import { ShieldAlert, Search, Users as UsersIcon, Loader } from "lucide-react";
import { useAuthStore } from "../features/auth/store";
import { usersApi, type UserPublic } from "../services/usersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Dialog Components ───────────────────────────────────────────────────────

function BlockDialog({
  user,
  onClose,
  onConfirm,
  isLoading,
}: {
  user: UserPublic;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Block User</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to block <strong>{user.name}</strong> (
          {user.email})? They will not be able to log in until unblocked.
        </p>
        <div className="mt-4 space-y-1.5">
          <label htmlFor="block-reason" className="text-sm font-medium">
            Reason (optional)
          </label>
          <textarea
            id="block-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for blocking..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            disabled={isLoading}
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Blocking..." : "Block User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnblockDialog({
  user,
  onClose,
  onConfirm,
  isLoading,
}: {
  user: UserPublic;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Unblock User</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to unblock <strong>{user.name}</strong> (
          {user.email})? They will be able to log in again.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Unblocking..." : "Unblock User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangeRoleDialog({
  user,
  onClose,
  onConfirm,
  isLoading,
}: {
  user: UserPublic;
  onClose: () => void;
  onConfirm: (role: "admin" | "user") => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Change User Role</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Change role for <strong>{user.name}</strong> ({user.email}). Current
          role: <span className="font-medium">{user.role}</span>
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          {user.role === "admin" ? (
            <button
              onClick={() => onConfirm("user")}
              disabled={isLoading}
              className="rounded-md bg-warning px-4 py-2 text-sm font-medium text-warning-foreground hover:bg-warning/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Changing..." : "Change to User"}
            </button>
          ) : (
            <button
              onClick={() => onConfirm("admin")}
              disabled={isLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Changing..." : "Change to Admin"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export function UserManagementPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [blockedFilter, setBlockedFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Dialog state
  const [dialogUser, setDialogUser] = useState<UserPublic | null>(null);
  const [dialogType, setDialogType] = useState<
    "block" | "unblock" | "role" | null
  >(null);

  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter, blockedFilter],
    queryFn: () =>
      usersApi.listUsers({
        page,
        page_size: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        is_blocked:
          blockedFilter === "blocked"
            ? true
            : blockedFilter === "active"
              ? false
              : undefined,
      }),
  });

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      usersApi.blockUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogUser(null);
      setDialogType(null);
    },
  });

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: (userId: string) => usersApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogUser(null);
      setDialogType(null);
    },
  });

  // Role mutation
  const roleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "user";
    }) => usersApi.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogUser(null);
      setDialogType(null);
    },
  });

  // Admin guard — non-admins see locked screen
  if (user?.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Admin Access Required</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You need admin privileges to manage users.
          </p>
        </div>
      </div>
    );
  }

  const users = data?.users ?? [];
  const totalPages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  // Stats
  const totalUsers = total;
  const blockedCount = users.filter((u) => u.is_blocked).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="px-8 py-6 border-b">
        <h1 className="text-2xl font-semibold text-foreground">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user accounts, roles, and access permissions.
        </p>
      </div>

      {/* Stats bar */}
      <div className="px-8 py-4 border-b bg-muted/30">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Users:</span>
            <span className="text-sm font-semibold">{totalUsers}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Blocked:</span>
            <span className="text-sm font-semibold text-destructive">
              {blockedCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Admins:</span>
            <span className="text-sm font-semibold text-primary">
              {adminCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={blockedFilter}
          onChange={(e) => {
            setBlockedFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-destructive">
            Failed to load users
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No users found
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                <th className="px-8 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-8 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-8 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-8 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {u.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {u.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    {u.is_blocked ? (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {u.is_blocked ? (
                        <button
                          onClick={() => {
                            setDialogUser(u);
                            setDialogType("unblock");
                          }}
                          className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setDialogUser(u);
                            setDialogType("block");
                          }}
                          className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Block
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDialogUser(u);
                          setDialogType("role");
                        }}
                        className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        Change Role
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-8 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {dialogUser && dialogType === "block" && (
        <BlockDialog
          user={dialogUser}
          onClose={() => {
            setDialogUser(null);
            setDialogType(null);
          }}
          onConfirm={(reason) =>
            blockMutation.mutate({ userId: dialogUser.id, reason })
          }
          isLoading={blockMutation.isPending}
        />
      )}
      {dialogUser && dialogType === "unblock" && (
        <UnblockDialog
          user={dialogUser}
          onClose={() => {
            setDialogUser(null);
            setDialogType(null);
          }}
          onConfirm={() => unblockMutation.mutate(dialogUser.id)}
          isLoading={unblockMutation.isPending}
        />
      )}
      {dialogUser && dialogType === "role" && (
        <ChangeRoleDialog
          user={dialogUser}
          onClose={() => {
            setDialogUser(null);
            setDialogType(null);
          }}
          onConfirm={(role) =>
            roleMutation.mutate({ userId: dialogUser.id, role })
          }
          isLoading={roleMutation.isPending}
        />
      )}
    </div>
  );
}
