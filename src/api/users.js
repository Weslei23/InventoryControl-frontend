import { api } from "./client";

export const UsersAPI = {
  me: () => api.get("/api/v1/users/me").then((r) => r.data),
  permissions: () => api.get("/api/v1/users/permissions").then((r) => r.data),
  list: ({ page = 0, size = 20, sort } = {}) =>
    api.get("/api/v1/users", { params: { page, size, sort } }).then((r) => r.data),
  getById: (id) => api.get(`/api/v1/users/${id}`).then((r) => r.data),
  // PUT replaces the whole set of individually-granted permissions.
  updatePermissions: (id, permissions) =>
    api.put(`/api/v1/users/${id}/permissions`, { permissions }).then((r) => r.data),
  updateRole: (id, role) => api.put(`/api/v1/users/${id}/role`, { role }).then((r) => r.data),
};
