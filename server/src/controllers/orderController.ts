import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import {
  users,
  cartItems,
  products,
  productImages,
  orders,
  orderItems,
  productVariants,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { stripe } from "../utils/stripe";

// Helper to enrich order items with product details
const enrichOrderItems = async (
  orderItemsList: (typeof orderItems.$inferSelect)[],
) => {
  if (orderItemsList.length === 0) return [];

  console.log(
    "[enrichOrderItems] Input items:",
    JSON.stringify(orderItemsList),
  );

  const enriched = await Promise.all(
    orderItemsList.map(async (item) => {
      const [product] = await db
        .select({
          name: products.name,
          price: products.price,
          imageUrl: productImages.imageUrl,
        })
        .from(products)
        .leftJoin(
          productImages,
          and(
            eq(productImages.productId, products.id),
            eq(productImages.displayOrder, 0),
          ),
        )
        .where(eq(products.id, item.productId))
        .limit(1);

      console.log(
        "[enrichOrderItems] Product for item",
        item.productId,
        ":",
        JSON.stringify(product),
      );
      console.log(
        "[enrichOrderItems] item.unitPrice:",
        item.unitPrice,
        "product?.price:",
        product?.price,
        "typeof product?.price:",
        typeof product?.price,
      );

      const finalPrice = product?.price
        ? Number(product.price).toFixed(2)
        : item.unitPrice;

      console.log("[enrichOrderItems] finalPrice:", finalPrice);

      // Return enriched order item. Use snake_case `unit_price` to match the frontend expectations.
      return {
        ...item,
        productName: product?.name ?? "Unknown Product",
        productImageUrl: product?.imageUrl ?? null,
        unit_price: finalPrice,
      };
    }),
  );

  console.log("[enrichOrderItems] Enriched items:", JSON.stringify(enriched));
  return enriched;
};

// Helper to convert Clerk ID to internal user ID
const getUserId = async (clerkId: string): Promise<number | null> => {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id ?? null;
};

export const orderController = {
  // ------------------------------------------------------------
  // POST /api/orders — Create order after Stripe payment
  // Validates payment intent, creates order + items, decrements stock, clears cart
  // ------------------------------------------------------------
  create: async (req: Request, res: Response) => {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = await getUserId(clerkId);
    if (!userId) {
      return res.status(404).json({ error: "User not found" });
    }

    const { payment_intent_id, shipping_address } = req.body;

    // Verify the Stripe payment intent exists and is succeeded
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    } catch (err) {
      return res.status(400).json({ error: "Invalid payment intent ID" });
    }

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: "Payment has not been completed",
        status: paymentIntent.status,
      });
    }

    // Fetch user's cart with product and variant info
    const cart = await db.query.cartItems.findMany({
      where: (fields, { eq }) => eq(fields.userId, userId),
      with: {
        product: true,
        variant: true,
      },
    });

    if (cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total amount
    const totalAmount = cart.reduce((total, item) => {
      const price = Number(item.product.price);
      return total + price * item.quantity;
    }, 0);

    // Create the order
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        totalAmount: totalAmount.toFixed(2),
        status: "paid",
        stripePaymentIntentId: payment_intent_id,
        shippingAddress: shipping_address,
      })
      .returning();

    // DEBUG: log cart items and their prices
    console.log("[orderController.create] Cart items:");
    cart.forEach((item, i) => {
      console.log(
        `  [${i}] productId=${item.productId}, product.price=${item.product?.price}, typeof=${typeof item.product?.price}, quantity=${item.quantity}`,
      );
    });

    // Create order items (snapshot of products/variants at time of purchase)
    const orderItemsData = cart.map((item) => {
      const price = item.product?.price ?? 0;
      console.log(
        `[orderController.create] item ${item.productId}: price=${price}, Number(price)=${Number(price)}, toFixed=${Number(price).toFixed(2)}`,
      );
      return {
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        variantName: item.variant?.name ?? null,
        quantity: item.quantity,
        unitPrice: Number(price).toFixed(2),
      };
    });

    await db.insert(orderItems).values(orderItemsData);

    // Decrement stock for each product
    for (const item of cart) {
      await db
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    // Clear the user's cart
    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    // Return the created order with enriched items
    const createdOrder = await db.query.orders.findFirst({
      where: (fields, { eq }) => eq(fields.id, order.id),
      with: {
        items: true,
      },
    });

    if (createdOrder) {
      createdOrder.items = await enrichOrderItems(createdOrder.items);
    }

    res.status(201).json(createdOrder);
  },

  // ------------------------------------------------------------
  // GET /api/orders — Get user's order history (newest first)
  // ------------------------------------------------------------
  list: async (req: Request, res: Response) => {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = await getUserId(clerkId);
    if (!userId) {
      return res.status(404).json({ error: "User not found" });
    }

    const userOrders = await db.query.orders.findMany({
      where: (fields, { eq }) => eq(fields.userId, userId),
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      with: {
        items: true,
      },
    });

    // Enrich items with product details and add item count
    const enrichedOrders = await Promise.all(
      userOrders.map(async (order) => ({
        ...order,
        items: await enrichOrderItems(order.items),
        itemCount: order.items.length,
      })),
    );

    res.json(enrichedOrders);
  },

  // ------------------------------------------------------------
  // GET /api/orders/:id — Get single order with items
  // ------------------------------------------------------------
  getOne: async (req: Request, res: Response) => {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = await getUserId(clerkId);
    if (!userId) {
      return res.status(404).json({ error: "User not found" });
    }

    const orderId = parseInt(req.params.id as string);

    const order = await db.query.orders.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.id, orderId), eq(fields.userId, userId)),
      with: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.items = await enrichOrderItems(order.items);
    res.json(order);
  },
};
