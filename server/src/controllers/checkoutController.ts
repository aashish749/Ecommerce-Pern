import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../db";
import { cartItems, products, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "../utils/stripe";

// Helper to convert our DB user (clerk_id) to internal user ID
const getUserId = async (clerkId: string): Promise<number | null> => {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id ?? null;
};

export const checkoutController = {
  // ------------------------------------------------------------
  // POST /api/checkout/create-payment-intent
  // Fetches user's cart, calculates total, creates Stripe PaymentIntent
  // ------------------------------------------------------------
  createPaymentIntent: async (req: Request, res: Response) => {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = await getUserId(clerkId);
    if (!userId) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch user's cart with product details
    const cart = await db.query.cartItems.findMany({
      where: (fields, { eq }) => eq(fields.userId, userId),
      with: {
        product: true,
      },
    });

    if (cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total amount in cents (Stripe uses smallest currency unit)
    // Convert the numeric price to a number and multiply by 100 for cents
    const amountInCents = cart.reduce((total, item) => {
      const price = Number(item.product.price);
      return total + Math.round(price * 100 * item.quantity);
    }, 0);

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
    });
  },
};
