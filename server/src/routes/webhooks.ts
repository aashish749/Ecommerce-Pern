import express, { Router } from "express";
import { stripe } from "../utils/stripe";
import { db } from "../db";
import { orders } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/webhooks/stripe — Stripe webhook for payment events
// Uses express.raw() to get the raw body for signature verification
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Handle the payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Update the order status to "paid" — but we already set it to "paid"
      // during order creation. This is a safety net / backup.
      // In production, you'd use this webhook as the PRIMARY trigger.
      await db
        .update(orders)
        .set({ status: "paid" })
        .where(eq(orders.stripePaymentIntentId, paymentIntentId));

      console.log(`✅ Payment succeeded for intent: ${paymentIntentId}`);
    }

    // Acknowledge receipt of the event
    res.json({ received: true });
  },
);

export default router;
