import { api } from "./client";

export const CategoriesAPI = {
  // Backend now returns a Spring Page<T>: { content, totalElements, totalPages, number, size, ... }
  list: ({ page = 0, size = 20, sort } = {}) =>
    api.get("/api/v1/categories", { params: { page, size, sort } }).then((r) => r.data),
  getByName: (name) => api.get(`/api/v1/categories/${encodeURIComponent(name)}`).then((r) => r.data),
  create: (payload) => api.post("/api/v1/categories/add", payload),
  update: (id, payload) => api.put(`/api/v1/categories/update/${id}`, payload),
  remove: (id) => api.delete(`/api/v1/categories/delete/${id}`),
};
