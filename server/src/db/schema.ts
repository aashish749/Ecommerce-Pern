import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  json,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. USERS TABLE
// ==========================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ==========================================
// 1. USERS RELATIONS
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
}));

// ==========================================
// 2. PRODUCTS TABLE
// ==========================================
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
// ==========================================
// 2. PRODUCTS RELATIONS
// ==========================================
export const productsRelations = relations(products, ({ many }) => ({
  productCategories: many(productCategories),
  images: many(productImages),
  variants: many(productVariants),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

// ==========================================
// 3. CATEGORIES TABLE
// ==========================================
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
// ==========================================
// 3. CATEGORIES RELATIONS
// ==========================================
export const categoriesRelations = relations(categories, ({ many }) => ({
  productCategories: many(productCategories),
}));

// ==========================================
// 4. PRODUCT CATEGORIES (Join Table)
// ==========================================
export const productCategories = pgTable(
  "product_categories",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.categoryId] })],
);
// ==========================================
// 4. PRODUCT CATEGORIES RELATIONS (Join Table)
// ==========================================
export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

// ==========================================
// 5. PRODUCT IMAGES TABLE
// ==========================================
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }), // 👈 Fixed
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
// ==========================================
// 5. PRODUCT IMAGES RELATIONS
// ==========================================
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

// ==========================================
// 6. PRODUCT VARIANTS TABLE
// ==========================================
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }), // 👈 Fixed
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
// ==========================================
// 6. PRODUCT VARIANTS RELATIONS
// ==========================================
export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    cartItems: many(cartItems), // If a variant is selected in active carts
  }),
);

// ==========================================
// 7. CART ITEMS TABLE
// ==========================================
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // 👈 Fixed
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }), // 👈 Fixed
  variantId: integer("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }), // 👈 Optional link to variant
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==========================================
// 7. CART ITEMS RELATIONS
// ==========================================
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

// ==========================================
// 8. ORDERS TABLE
// ==========================================
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }), // 👈 Restrict prevents deleting users if they have order records history
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  shippingAddress: json("shipping_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
// ==========================================
// 8. ORDERS RELATIONS
// ==========================================
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

// ==========================================
// 9. ORDER ITEMS TABLE
// ==========================================
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }), // 👈 Fixed: Cleans up items if order is purged
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }), // 👈 Protects historical sales data from being broken if a product gets deleted
  variantId: integer("variant_id"), // Kept simple as variant might change or be removed over time
  variantName: varchar("variant_name", { length: 100 }),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
// ==========================================
// 9. ORDER ITEMS RELATIONS
// ==========================================
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
