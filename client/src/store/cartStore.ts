import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  cartApi,
  type AddCartItemData,
  type UpdateCartItemData,
} from "../api/cart";
import type { CartItem } from "../types";

interface CartState {
  items: CartItem[];
  loading: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (
    productId: number,
    quantity: number,
    variantId?: number,
  ) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;

  cartTotal: () => number;
  cartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      fetchCart: async () => {
        set({ loading: true });
        try {
          const data = await cartApi.list();
          set({ items: data.items ?? [], loading: false });
        } catch {
          set({ loading: false });
        }
      },

      addToCart: async (productId, quantity, variantId) => {
        const data: AddCartItemData = {
          product_id: productId,
          quantity,
          variant_id: variantId,
        };
        try {
          await cartApi.add(data);
          const cart = await cartApi.list();
          set({ items: cart.items ?? [] });
        } catch (err: any) {
          if (err?.response?.status === 401) {
            alert("Please sign in to add items to your cart");
          } else {
            console.error("Add to cart failed:", err);
          }
        }
      },

      updateQuantity: async (id, quantity) => {
        const data: UpdateCartItemData = { quantity };
        await cartApi.update(id, data);
        const cart = await cartApi.list();
        set({ items: cart.items ?? [] });
      },

      removeItem: async (id) => {
        await cartApi.remove(id);
        const cart = await cartApi.list();
        set({ items: cart.items ?? [] });
      },

      clearCart: async () => {
        await cartApi.clear();
        set({ items: [] });
      },

      cartTotal: () => {
        return get().items.reduce((sum, item) => {
          return sum + Number(item.product.price) * item.quantity;
        }, 0);
      },

      cartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "shopping-cart-storage", // Added this
    },
  ),
);
