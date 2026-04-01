import type { DataErasureRequest } from "../../types";

export interface MockUser {
  id: string;
  email: string;
  name: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: "user_1", email: "alice@example.com", name: "Alice" },
  { id: "user_2", email: "bob@example.com", name: "Bob" },
  { id: "user_3", email: "carol@example.com", name: "Carol" },
  { id: "admin_1", email: "admin@example.com", name: "Admin" },
];

export const AVAILABLE_ROLES = ["admin", "analyst", "viewer", "editor"];

// In-memory store for erasure requests
let erasureRequests: DataErasureRequest[] = [];

export const getErasureRequests = () => [...erasureRequests];

export const addErasureRequest = (
  request: DataErasureRequest,
): DataErasureRequest => {
  erasureRequests = [...erasureRequests, request];
  return request;
};

export const resetErasureRequests = () => {
  erasureRequests = [];
};
