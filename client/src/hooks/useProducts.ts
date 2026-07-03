import { useQuery } from "@tanstack/react-query";
import { productsApi, type ProductFilters } from "../api/products";

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productsApi.list(filters),
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getOne(id),
    enabled: !!id,
  });
}
