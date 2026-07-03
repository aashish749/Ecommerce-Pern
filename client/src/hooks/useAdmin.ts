import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  type AdminOrdersParams,
  type UpdateOrderStatusData,
} from "../api/admin";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      try {
        const data = await adminApi.getStats();
        console.log("[useAdminStats] success:", data);
        return data;
      } catch (err: any) {
        console.error(
          "[useAdminStats] error:",
          err?.response?.data || err?.message || err,
        );
        throw err;
      }
    },
  });
}

export function useRevenueTrend() {
  return useQuery({
    queryKey: ["admin", "revenue-trend"],
    queryFn: () => adminApi.getRevenueTrend(),
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ["admin", "top-products"],
    queryFn: () => adminApi.getTopProducts(),
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ["admin", "recent-orders"],
    queryFn: async () => {
      try {
        const data = await adminApi.getRecentOrders();
        console.log("[useRecentOrders] success:", data);
        return data;
      } catch (err: any) {
        console.error(
          "[useRecentOrders] error:",
          err?.response?.data || err?.message || err,
        );
        throw err;
      }
    },
  });
}

export function useAdminOrders(params?: AdminOrdersParams) {
  return useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: async () => {
      try {
        const data = await adminApi.listOrders(params);
        console.log("[useAdminOrders] success:", data);
        return data;
      } catch (err: any) {
        console.error(
          "[useAdminOrders] error:",
          err?.response?.data || err?.message || err,
        );
        throw err;
      }
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderStatusData }) =>
      adminApi.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
