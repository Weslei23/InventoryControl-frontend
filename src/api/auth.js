import { api } from "./client";

export const AuthAPI = {
  login: (payload) => api.post("/api/v1/auth/login", payload).then((r) => r.data),
  register: (payload) => api.post("/api/v1/auth/register", payload).then((r) => r.data),
};
