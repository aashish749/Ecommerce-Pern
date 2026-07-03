// server/src/db/seed.ts
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  categories,
  products,
  productCategories,
  productImages,
  productVariants,
  cartItems,
  orders,
  orderItems,
} from "./schema";

// ------------------------------------------------------------------
// Helper to pick random item from array
// ------------------------------------------------------------------
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ------------------------------------------------------------------
// Sample data
// ------------------------------------------------------------------
const categoryNames = ["Electronics", "Clothing", "Sports", "Home", "Books"];

const productsData = [
  {
    name: "Classic Cotton T-Shirt",
    description:
      "Soft, breathable 100% cotton t-shirt. Perfect for everyday wear.",
    price: "24.99",
    stock: 50,
    categoryNames: ["Clothing"],
    variants: ["Red", "Blue", "Green"],
    imageBaseId: 1,
  },
  {
    name: "Wireless Bluetooth Headphones",
    description: "Noise-cancelling over-ear headphones with 30h battery life.",
    price: "79.99",
    stock: 30,
    categoryNames: ["Electronics"],
    variants: ["Black", "White"],
    imageBaseId: 2,
  },
  {
    name: "Running Shoes Pro",
    description: "Lightweight, cushioned running shoes for all terrains.",
    price: "129.99",
    stock: 25,
    categoryNames: ["Sports", "Clothing"],
    variants: ["Black", "White", "Navy"],
    imageBaseId: 3,
  },
  {
    name: "Smart Watch Ultra",
    description: "Fitness tracker with heart rate monitor and GPS.",
    price: "249.99",
    stock: 15,
    categoryNames: ["Electronics"],
    variants: ["Silver", "Black"],
    imageBaseId: 4,
  },
  {
    name: "Yoga Mat Premium",
    description: "Eco-friendly non-slip yoga mat, 6mm thick.",
    price: "34.99",
    stock: 40,
    categoryNames: ["Sports"],
    variants: ["Purple", "Blue", "Grey"],
    imageBaseId: 5,
  },
  {
    name: "Leather Wallet",
    description: "Genuine leather wallet with 6 card slots and coin pocket.",
    price: "49.99",
    stock: 60,
    categoryNames: ["Clothing"],
    variants: ["Brown", "Black"],
    imageBaseId: 6,
  },
  {
    name: "Insulated Water Bottle",
    description: "Stainless steel, keeps drinks cold 24h / hot 12h.",
    price: "29.99",
    stock: 100,
    categoryNames: ["Sports", "Home"],
    variants: ["White", "Black", "Green"],
    imageBaseId: 7,
  },
  {
    name: "Desk Lamp LED",
    description: "Adjustable brightness, touch control, USB charging port.",
    price: "59.99",
    stock: 35,
    categoryNames: ["Home", "Electronics"],
    variants: ["Black", "White"],
    imageBaseId: 8,
  },
];

// ------------------------------------------------------------------
// Seed function (clears existing data first)
// ------------------------------------------------------------------
async function seed() {
  console.log("🌱 Starting database seed...");

  // ---- 1. Clear tables in correct order (respect foreign keys) ----
  console.log("🧹 Clearing existing data...");
  await db.execute(sql`TRUNCATE TABLE order_items RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE orders RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE cart_items RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE product_images RESTART IDENTITY CASCADE`);
  await db.execute(
    sql`TRUNCATE TABLE product_variants RESTART IDENTITY CASCADE`,
  );
  await db.execute(
    sql`TRUNCATE TABLE product_categories RESTART IDENTITY CASCADE`,
  );
  await db.execute(sql`TRUNCATE TABLE products RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);

  // ---- 2. Insert categories ----
  console.log("📂 Inserting categories...");
  const insertedCategories: Record<string, number> = {};
  for (const name of categoryNames) {
    const [cat] = await db.insert(categories).values({ name }).returning();
    insertedCategories[name] = cat.id;
  }

  // ---- 3. Insert products ----
  console.log("📦 Inserting products...");
  const insertedProducts: any[] = [];
  for (const p of productsData) {
    const [product] = await db
      .insert(products)
      .values({
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        isActive: true,
      })
      .returning();
    insertedProducts.push({ ...product, data: p });
  }

  // ---- 4. Insert product-categories relationships ----
  console.log("🔗 Linking products to categories...");
  for (const prod of insertedProducts) {
    const catNames = prod.data.categoryNames;
    for (const catName of catNames) {
      const categoryId = insertedCategories[catName];
      if (categoryId) {
        await db
          .insert(productCategories)
          .values({ productId: prod.id, categoryId });
      }
    }
  }

  // ---- 5. Insert product images (3 per product) ----
  console.log("🖼️ Inserting product images...");
  for (const prod of insertedProducts) {
    const baseId = prod.data.imageBaseId;
    const images = [
      { url: `https://picsum.photos/id/${baseId * 10 + 1}/600/400`, order: 0 },
      { url: `https://picsum.photos/id/${baseId * 10 + 2}/600/400`, order: 1 },
      { url: `https://picsum.photos/id/${baseId * 10 + 3}/600/400`, order: 2 },
    ];
    for (const img of images) {
      await db.insert(productImages).values({
        productId: prod.id,
        imageUrl: img.url,
        displayOrder: img.order,
      });
    }
  }

  // ---- 6. Insert product variants ----
  console.log("🎨 Inserting product variants...");
  for (const prod of insertedProducts) {
    const variantNames = prod.data.variants;
    for (let idx = 0; idx < variantNames.length; idx++) {
      await db.insert(productVariants).values({
        productId: prod.id,
        name: variantNames[idx],
      });
    }
  }

  // ---- 7. Insert users (admin + one regular user for testing) ----
  console.log("👤 Inserting users...");
  await db.insert(users).values([
    {
      clerkId: "clerk_admin_123",
      email: "admin@example.com",
      name: "Admin User",
    },
    {
      clerkId: "clerk_user_456",
      email: "customer@example.com",
      name: "Test Customer",
    },
  ]);

  console.log("✅ Seeding completed successfully!");
  console.log(`   - ${categoryNames.length} categories`);
  console.log(`   - ${insertedProducts.length} products`);
  console.log(`   - 2 users (admin + regular)`);
  console.log(
    `   - Each product has 3 images, 2-3 variants, and 1-2 categories.`,
  );
}

// ------------------------------------------------------------------
// Run seed
// ------------------------------------------------------------------
seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
