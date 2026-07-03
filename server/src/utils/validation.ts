import z from "zod";

// clerk webhook schema

//matches the payload clerk sends for the "user.created" and "user.updated" events

export const clerkUserSchema = z.object({
  type: z.string(), //eg "user.created" || "user.updated"
  data: z.object({
    id: z.string(), //clerk user id
    email_addresses: z.array(
      z
        .object({
          email_address: z.string(),
          id: z.string(),
        })
        .passthrough(),
    ),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
  }),
});
// you can add more field form the clerk webhook paylaod as needed
//e.g image_url, phone_number, etc

// export type for TypeScript interface
export type ClerkWebhookPayload = z.infer<typeof clerkUserSchema>;

// ==========================================
// CART SCHEMAS
// ==========================================

// For POST /api/cart — Add item to cart
// product_id is required, quantity must be >= 1, variant_id is optional
export const addCartItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().min(1),
  variant_id: z.number().optional().nullable(),
});

// For PUT /api/cart/:id — Update item quantity
// quantity must be >= 1
export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

// ==========================================
// ORDER SCHEMAS
// ==========================================

// For POST /api/orders — Create order after Stripe payment
// payment_intent_id from Stripe, shipping_address with required fields
export const createOrderSchema = z.object({
  payment_intent_id: z.string(),
  shipping_address: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
});

// ==========================================
// ADMIN ORDER MANAGEMENT SCHEMAS
// ==========================================

// For PUT /api/admin/orders/:id/status — Update order status
// Must be one of: pending, paid, shipped, cancelled
export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "cancelled"]),
});

// TypeScript types for cart and order payloads
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
