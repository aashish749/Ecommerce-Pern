import { Request, Response } from "express";
import { db } from "../db";
import { cartItems, products, productVariants } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const cartController = {
  // ------------------------------------------------------------
  // GET /api/cart — get user's cart with product details
  // ------------------------------------------------------------
  list: async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const items = await db.query.cartItems.findMany({
      where: (fields, { eq }) => eq(fields.userId, userId),
      with: {
        product: {
          with: {
            images: {
              orderBy: (images, { asc }) => [asc(images.displayOrder)],
              limit: 1,
            },
          },
        },
        variant: true,
      },
    });

    res.json({
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images[0]?.imageUrl ?? null,
        },
        variant: item.variant
          ? { id: item.variant.id, name: item.variant.name }
          : null,
      })),
    });
  },

  // ------------------------------------------------------------
  // POST /api/cart — add item to cart (or increment if exists)
  // ------------------------------------------------------------
  add: async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { product_id, quantity, variant_id } = req.body;

    // Verify product exists and is active
    const [product] = await db
      .select({ id: products.id, isActive: products.isActive })
      .from(products)
      .where(eq(products.id, product_id))
      .limit(1);

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found or inactive" });
    }

    // Check if same product + variant already in cart
    const whereConditions = [
      eq(cartItems.userId, userId),
      eq(cartItems.productId, product_id),
    ];
    if (variant_id) {
      whereConditions.push(eq(cartItems.variantId, variant_id));
    } else {
      whereConditions.push(eq(cartItems.variantId, null as unknown as number));
    }

    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(...whereConditions))
      .limit(1);

    if (existing) {
      // Increment quantity
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItems.id, existing.id))
        .returning();

      return res.json(updated);
    }

    // Insert new cart item
    const [newItem] = await db
      .insert(cartItems)
      .values({
        userId,
        productId: product_id,
        quantity,
        variantId: variant_id ?? null,
      })
      .returning();

    res.status(201).json(newItem);
  },

  // ------------------------------------------------------------
  // PUT /api/cart/:id — update cart item quantity
  // ------------------------------------------------------------
  update: async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const cartItemId = parseInt(req.params.id as string);
    const { quantity } = req.body;

    // Verify the cart item belongs to this user
    const [cartItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (quantity <= 0) {
      // Remove item
      await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
      return res.json({ message: "Cart item removed" });
    }

    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, cartItemId))
      .returning();

    res.json(updated);
  },

  // ------------------------------------------------------------
  // DELETE /api/cart/:id — remove single cart item
  // ------------------------------------------------------------
  remove: async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const cartItemId = parseInt(req.params.id as string);

    const [cartItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    res.json({ message: "Cart item removed" });
  },

  // ------------------------------------------------------------
  // DELETE /api/cart — clear entire cart
  // ------------------------------------------------------------
  clear: async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    res.json({ message: "Cart cleared" });
  },
};
