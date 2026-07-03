import api from "./axios";

export interface ProductFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductsListResponse {
  data: import("../types").Product[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  categoryIds?: number[];
  variantNames?: string[];
  imageUrls?: string[];
}

export const productsApi = {
  list: (params?: ProductFilters): Promise<ProductsListResponse> =>
    api.get("/api/products", { params }).then((res) => res.data),

  getOne: (id: number) =>
    api.get(`/api/products/${id}`).then((res) => res.data),

  create: (data: CreateProductPayload) =>
    api.post("/api/products", data).then((res) => res.data),

  update: (id: number, data: Partial<CreateProductPayload>) =>
    api.put(`/api/products/${id}`, data).then((res) => res.data),

  delete: (id: number) =>
    api.delete(`/api/products/${id}`).then((res) => res.data),
};
