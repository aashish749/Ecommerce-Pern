import api from "./axios";

export interface CreateOrderData {
  payment_intent_id: string;
  shipping_address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}

export const ordersApi = {
  create: (data: CreateOrderData) =>
    api.post("/api/orders", data).then((res) => res.data),

  list: () => api.get("/api/orders").then((res) => res.data),

  getOne: (id: number) => api.get(`/api/orders/${id}`).then((res) => res.data),
};
