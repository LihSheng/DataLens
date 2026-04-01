// ─── Document ACL Types ───────────────────────────────────────────────────────

export type AccessMode = "all" | "roles" | "users";

export interface DocumentAcl {
  documentId: string;
  accessMode: AccessMode;
  allowedRoles: string[];
  allowedUsers: string[];
}

// ─── Data Erasure Types ──────────────────────────────────────────────────────

export interface DataErasureRequest {
  userId: string;
  requestedAt: string;
  status: "pending" | "processing" | "completed";
}
