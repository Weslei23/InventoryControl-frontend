import { api } from "./client";

export const SuppliersAPI = {
  // Backend now returns a Spring Page<T>: { content, totalElements, totalPages, number, size, ... }
  list: ({ page = 0, size = 20, sort } = {}) =>
    api.get("/api/v1/supplier", { params: { page, size, sort } }).then((r) => r.data),
  getById: (id) => api.get(`/api/v1/supplier/${id}`).then((r) => r.data),
  create: (payload) => api.post("/api/v1/supplier/add", payload),
  update: (id, payload) => api.put(`/api/v1/supplier/update/${id}`, payload),
  remove: (id) => api.delete(`/api/v1/supplier/delete/${id}`),
};
