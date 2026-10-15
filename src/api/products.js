import { api } from "./client";

// The backend stores the uploaded file name in `image` and serves it at GET /api/v1/product/image/{name}
// (requires PRODUCT_READ). An <img src> cannot send the Authorization header, so the file is fetched
// through axios as a blob and shown via an object URL. Results are cached per file name for the session.
const imageCache = new Map(); // file name -> Promise<string | null>

export function fetchProductImageUrl(image) {
  if (!image) return Promise.resolve(null);
  if (!imageCache.has(image)) {
    const request = api
      .get(`/api/v1/product/image/${encodeURIComponent(image)}`, { responseType: "blob" })
      .then((r) => URL.createObjectURL(r.data))
      .catch(() => {
        imageCache.delete(image); // allow a retry later (e.g. permission granted, network back)
        return null;
      });
    imageCache.set(image, request);
  }
  return imageCache.get(image);
}

function buildProductFormData(payload, file) {
  const formData = new FormData();
  formData.append("product", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (file) {
    formData.append("file", file);
  }
  return formData;
}

export const ProductsAPI = {
  // Page<T>: { content, totalElements, totalPages, number, size, ... }
  list: ({ page = 0, size = 20, sort } = {}) =>
    api.get("/api/v1/product", { params: { page, size, sort } }).then((r) => r.data),
  getById: (id) => api.get(`/api/v1/product/${id}`).then((r) => r.data),
  // POST /add is multipart/form-data: a "product" JSON part + an optional "file" part.
  // Do not set a Content-Type header manually — the browser must compute the multipart boundary itself.
  create: (payload, file) => api.post("/api/v1/product/add", buildProductFormData(payload, file)),
  // PUT /update/{id} is plain JSON (@RequestBody) — it does NOT accept a file. `image` must carry the
  // current file name, otherwise the backend overwrites it with null.
  update: (id, payload) => api.put(`/api/v1/product/update/${id}`, payload),
  remove: (id) => api.delete(`/api/v1/product/delete/${id}`),
  downloadSheet: () =>
    api.get("/api/v1/product/download", { responseType: "blob" }).then((r) => r.data),
};
