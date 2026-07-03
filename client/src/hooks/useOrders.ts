import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi, type CreateOrderData } from "../api/orders";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list(),
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderData) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
