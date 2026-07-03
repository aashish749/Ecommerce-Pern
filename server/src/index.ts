// server/src/index.ts
import express from "express";
import cors from "cors";
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./db/db";
import { clerkMiddleware } from "@clerk/express";
import authRoutes from "./routes/auth";
import clerkWebhookRoutes from "./routes/clerkWebhook";
import uploadRoutes from "./routes/upload";
import categoryRoutes from "./routes/categories";
import productRoutes from "./routes/products";
import cartRoutes from "./routes/cart";
import checkoutRoutes from "./routes/checkout";
import orderRoutes from "./routes/orders";
import webhookRoutes from "./routes/webhooks";
import adminRoutes from "./routes/admin";

import {
  products,
  categories,
  productImages,
  productVariants,
} from "./db/schema";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
    ],
    credentials: true,
  }),
);

app.use(clerkMiddleware());

// Webhook routes — mounted BEFORE express.json()
// They MUST receive the raw body (Buffer) for svix/Stripe signature verification
app.use("/api/auth/webhooks", clerkWebhookRoutes);
app.use("/api/webhooks", webhookRoutes);

// All other routes use standard JSON parsing
app.use(express.json());

// Regular routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint (returns counts of seeded data)
app.get("/api/health", async (req, res) => {
  try {
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);
    const categoryCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories);
    const imageCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(productImages);
    const variantCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(productVariants);

    res.json({
      status: "ok",
      products: Number(productCount[0]?.count) || 0,
      categories: Number(categoryCount[0]?.count) || 0,
      images: Number(imageCount[0]?.count) || 0,
      variants: Number(variantCount[0]?.count) || 0,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Database connection failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
