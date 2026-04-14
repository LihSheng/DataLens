import { http, HttpResponse } from "msw";

const MOCK_USERS: Record<
  string,
  {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user";
    password: string;
    is_blocked: boolean;
  }
> = {
  "alice@example.com": {
    id: "usr_1",
    email: "alice@example.com",
    name: "Alice Chen",
    role: "admin",
    password: "password123",
    is_blocked: false,
  },
  "bob@example.com": {
    id: "usr_2",
    email: "bob@example.com",
    name: "Bob Smith",
    role: "user",
    password: "password123",
    is_blocked: false,
  },
};

let nextUserId = 3;

export const authHandlers = [
  // POST /api/auth/register
  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    } | null;

    if (!body?.email || !body?.password || !body?.name) {
      return HttpResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (MOCK_USERS[body.email]) {
      return HttpResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    }

    const newUser = {
      id: `usr_${nextUserId++}`,
      email: body.email,
      name: body.name,
      role: "user" as const,
      is_blocked: false,
    };
    MOCK_USERS[body.email] = { ...newUser, password: body.password };

    return HttpResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
        accessToken: "eyJhbGciOiJIUzI1NiJ9.mock_token_for_dev",
      },
      { status: 201 },
    );
  }),

  // POST /api/auth/login
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    } | null;

    if (!body?.email || !body?.password) {
      return HttpResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = MOCK_USERS[body.email];
    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (user.is_blocked) {
      return HttpResponse.json(
        { message: "Your account has been blocked. Contact an administrator." },
        { status: 403 },
      );
    }

    return HttpResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: "eyJhbGciOiJIUzI1NiJ9.mock_token_for_dev",
    });
  }),

  // POST /api/auth/logout
  http.post("/api/auth/logout", () => {
    return new Response(null, { status: 204 });
  }),
];
