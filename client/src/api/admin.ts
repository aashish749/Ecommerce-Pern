import api from "./axios";

export interface AdminOrdersParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface UpdateOrderStatusData {
  status: "pending" | "paid" | "shipped" | "cancelled";
}

export const adminApi = {
  getStats: () => api.get("/api/admin/stats").then((res) => res.data),

  getRevenueTrend: () =>
    api.get("/api/admin/revenue-trend").then((res) => res.data),

  getTopProducts: () =>
    api.get("/api/admin/top-products").then((res) => res.data),

  getRecentOrders: () =>
    api.get("/api/admin/recent-orders").then((res) => res.data),

  listOrders: (params?: AdminOrdersParams) =>
    api.get("/api/admin/orders", { params }).then((res) => res.data),

  updateOrderStatus: (id: number, data: UpdateOrderStatusData) =>
    api.put(`/api/admin/orders/${id}/status`, data).then((res) => res.data),
};
