import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ic_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function forceLogout() {
  localStorage.removeItem("ic_token");
  localStorage.removeItem("ic_user");
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

// The backend answers 403 both for "no/invalid/expired token" and for "valid token, but missing the
// required permission" (it never sends 401). So a 403 alone is ambiguous: we notify the app, which
// re-reads GET /users/me — if that also fails the session is dead (logout), otherwise the user's
// permissions were simply changed and the UI is refreshed.
export const FORBIDDEN_EVENT = "ic:forbidden";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/auth/");
    if (!isAuthCall) {
      if (status === 401) {
        forceLogout();
      } else if (status === 403 && localStorage.getItem("ic_token")) {
        window.dispatchEvent(new CustomEvent(FORBIDDEN_EVENT, { detail: { url } }));
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error, fallback = "Ocorreu um erro inesperado.") {
  if (!error?.response) {
    // Network failure / CORS / server down: there is no HTTP response at all.
    return "Não foi possível conectar ao servidor. Verifique se a API está no ar.";
  }
  const { status, data } = error.response;
  if (typeof data === "string" && data.trim() && !data.trim().startsWith("<")) return data;
  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message || e.defaultMessage || e).join(" ");
  }
  if (status === 403) return "Você não tem permissão para realizar esta ação.";
  if (status === 404) return "Registro não encontrado.";
  if (status === 409) return "Já existe um registro com estes dados.";
  if (status >= 500) {
    // The backend has no handler for IllegalArgumentException (e.g. insufficient stock, duplicated
    // name), so those business-rule failures arrive as a bare 500 without a message.
    return `${fallback} (o servidor recusou a operação — verifique os dados informados, como estoque suficiente ou nomes duplicados).`;
  }
  return fallback;
}
