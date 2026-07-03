import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // ✅ FIX: Use the new top-level z.flattenError helper function
      const formattedErrors = z.flattenError(result.error).fieldErrors;

      return res
        .status(400)
        .json({ error: "validation failed", details: formattedErrors });
    }
    //replace the req.body with the parsed data
    req.body = result.data;
    next();
  };
};

// Categories
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

//Products
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  categoryIds: z.array(z.number().int()).optional().default([]),
  variantNames: z.array(z.string().min(1)).optional().default([]),
  imageUrls: z.array(z.string()).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

// Cart
export const addCartItemSchema = z.object({
  product_id: z.number().int(),
  quantity: z.number().int().min(1),
  variant_id: z.number().int().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

// Orders
export const createOrderSchema = z.object({
  payment_intent_id: z.string().min(1),
  shipping_address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
  }),
});
