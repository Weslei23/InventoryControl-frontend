import { api } from "./client";

export const MovementsAPI = {
  // Backend now returns a Spring Page<T>: { content, totalElements, totalPages, number, size, ... }
  list: ({ page = 0, size = 20, sort } = {}) =>
    api.get("/api/v1/movement", { params: { page, size, sort } }).then((r) => r.data),
  inbound: (payload) => api.post("/api/v1/movement/inbound", payload),
  outbound: (payload) => api.post("/api/v1/movement/outbound", payload),
  create: (payload) => api.post("/api/v1/movement/add", payload),
  update: (id, payload) => api.put(`/api/v1/movement/update/${id}`, payload),
  remove: (id) => api.delete(`/api/v1/movement/delete/${id}`),
};
