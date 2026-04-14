import { http, HttpResponse } from "msw";
import { addErasureRequest } from "../data/users";

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  is_blocked: boolean;
  blocked_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
}

const MOCK_DB_USERS: MockUser[] = [
  {
    id: "usr_1",
    email: "alice@example.com",
    name: "Alice Chen",
    role: "admin",
    is_blocked: false,
    blocked_at: null,
    is_deleted: false,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: null,
  },
  {
    id: "usr_2",
    email: "bob@example.com",
    name: "Bob Smith",
    role: "user",
    is_blocked: false,
    blocked_at: null,
    is_deleted: false,
    created_at: "2024-02-20T14:30:00Z",
    updated_at: null,
  },
  {
    id: "usr_3",
    email: "charlie@example.com",
    name: "Charlie Brown",
    role: "user",
    is_blocked: true,
    blocked_at: "2024-03-01T09:00:00Z",
    is_deleted: false,
    created_at: "2024-02-25T11:15:00Z",
    updated_at: "2024-03-01T09:00:00Z",
  },
];

export const userHandlers = [
  // DELETE /api/users/:id/data — request data erasure
  http.delete("/api/users/:id/data", ({ params }) => {
    const { id } = params as { id: string };

    if (!id) {
      return HttpResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }

    const request: import("../../types").DataErasureRequest = {
      userId: id,
      requestedAt: new Date().toISOString(),
      status: "pending",
    };

    addErasureRequest(request);

    return HttpResponse.json(request, { status: 202 });
  }),

  // GET /api/admin/users — list users (DISABLED: let real backend handle this)

  // POST /api/admin/users/:id/block
  http.post("/api/admin/users/:id/block", ({ params }) => {
    const { id } = params as { id: string };

    const user = MOCK_DB_USERS.find((u) => u.id === id);
    if (!user) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.is_blocked) {
      return HttpResponse.json(
        { message: "User is already blocked" },
        { status: 400 },
      );
    }

    user.is_blocked = true;
    user.blocked_at = new Date().toISOString();

    return HttpResponse.json({
      user_id: user.id,
      is_blocked: true,
      blocked_at: user.blocked_at,
    });
  }),

  // POST /api/admin/users/:id/unblock
  http.post("/api/admin/users/:id/unblock", ({ params }) => {
    const { id } = params as { id: string };

    const user = MOCK_DB_USERS.find((u) => u.id === id);
    if (!user) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.is_blocked) {
      return HttpResponse.json(
        { message: "User is not blocked" },
        { status: 400 },
      );
    }

    user.is_blocked = false;
    user.blocked_at = null;

    return HttpResponse.json({
      user_id: user.id,
      is_blocked: false,
    });
  }),

  // PATCH /api/admin/users/:id/role
  http.patch("/api/admin/users/:id/role", async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as { role?: string } | null;

    if (!body?.role || !["admin", "user"].includes(body.role)) {
      return HttpResponse.json(
        { message: "Role must be 'admin' or 'user'" },
        { status: 400 },
      );
    }

    const user = MOCK_DB_USERS.find((u) => u.id === id);
    if (!user) {
      return HttpResponse.json({ message: "User not found" }, { status: 404 });
    }

    user.role = body.role as "admin" | "user";
    user.updated_at = new Date().toISOString();

    return HttpResponse.json({
      user_id: user.id,
      role: user.role,
      updated_at: user.updated_at,
    });
  }),
];
