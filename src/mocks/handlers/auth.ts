import { http, HttpResponse } from "msw";

const MOCK_USER = {
  id: "usr_1",
  email: "alice@example.com",
  name: "Alice Chen",
};

const VALID_PASSWORD = "password123";

export const authHandlers = [
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

    if (body.email !== MOCK_USER.email || body.password !== VALID_PASSWORD) {
      return HttpResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      user: MOCK_USER,
      accessToken: "eyJhbGciOiJIUzI1NiJ9.mock_token_for_dev",
    });
  }),

  // POST /api/auth/logout
  http.post("/api/auth/logout", () => {
    return new Response(null, { status: 204 });
  }),
];
