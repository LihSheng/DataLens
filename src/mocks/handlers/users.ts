import { http, HttpResponse } from "msw";
import { addErasureRequest } from "../data/users";

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
];
