import api from "./axios";

export interface AddCartItemData {
  product_id: number;
  quantity: number;
  variant_id?: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export const cartApi = {
  list: () => api.get("/api/cart").then((res) => res.data),

  add: (data: AddCartItemData) =>
    api.post("/api/cart", data).then((res) => res.data),

  update: (id: number, data: UpdateCartItemData) =>
    api.put(`/api/cart/${id}`, data).then((res) => res.data),

  remove: (id: number) => api.delete(`/api/cart/${id}`).then((res) => res.data),

  clear: () => api.delete("/api/cart").then((res) => res.data),
};
