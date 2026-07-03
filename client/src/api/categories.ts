import api from "./axios";

export const categoriesApi = {
  list: () => api.get("/api/categories").then((res) => res.data),

  create: (data: { name: string }) =>
    api.post("/api/categories", data).then((res) => res.data),

  update: (id: number, data: { name: string }) =>
    api.put(`/api/categories/${id}`, data).then((res) => res.data),

  delete: (id: number) =>
    api.delete(`/api/categories/${id}`).then((res) => res.data),
};
