# 🛒 Ecommerce Pern — 7-Day Implementation Plan

> **Methodology**: Backend First, Frontend Second. All backend routes must be tested via Postman before any frontend code is written.

---

## 📋 Architecture Decisions (Locked)

| Decision             | Choice                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database**         | Neon (cloud PostgreSQL)                                                                                                                             |
| **ORM**              | Drizzle ORM                                                                                                                                         |
| **Authentication**   | Clerk (webhook-based user sync)                                                                                                                     |
| **Admin Role**       | Clerk `public_metadata.role`                                                                                                                        |
| **Cart Strategy**    | Authenticated-only (no guest cart)                                                                                                                  |
| **Checkout**         | Stripe (test/sandbox mode)                                                                                                                          |
| **Image Storage**    | Multer middleware → Cloudinary                                                                                                                      |
| **Product Images**   | Multiple images per product (`product_images` table)                                                                                                |
| **Categories**       | Many-to-many (`categories` + `product_categories` join table)                                                                                       |
| **Product Variants** | Single-dimension only (e.g., Color: Red/Blue/Green OR Size: S/M/L, not both). Shared price & stock from parent product. No variant-specific images. |
| **Seeding**          | Yes — 8 sample products + categories + variants + 1 admin user                                                                                      |
| **Repo Structure**   | Monorepo (`/client` + `/server`)                                                                                                                    |
| **State Management** | TanStack Query (server state) + Zustand (cart)                                                                                                      |
| **Validation**       | Zod (schema validation on all API request bodies)                                                                                                   |

---

## 🗄️ Database Schema (8 Tables)

### Entity Relationship Diagram

```
users ──┬── cart_items ──── products ──┬── product_images
        │                              ├── product_variants
        │                              └── product_categories ──── categories
        └── orders ──── order_items ───┘
```

---

### `users`

| Column       | Type                           | Notes          |
| ------------ | ------------------------------ | -------------- |
| `id`         | `serial PRIMARY KEY`           | Auto-increment |
| `clerk_id`   | `varchar(255) UNIQUE NOT NULL` | Clerk user ID  |
| `email`      | `varchar(255) UNIQUE NOT NULL` |                |
| `name`       | `varchar(255) NOT NULL`        |                |
| `created_at` | `timestamp DEFAULT now()`      |                |
| `updated_at` | `timestamp DEFAULT now()`      |                |

> **Note**: No `role` column — roles are stored in Clerk `public_metadata`. Admin check reads `req.auth.sessionClaims.publicMetadata.role`.

### `products`

| Column        | Type                      | Notes                                 |
| ------------- | ------------------------- | ------------------------------------- |
| `id`          | `serial PRIMARY KEY`      |                                       |
| `name`        | `varchar(255) NOT NULL`   |                                       |
| `description` | `text`                    |                                       |
| `price`       | `numeric(10, 2) NOT NULL` | In euros — shared across all variants |
| `stock`       | `integer DEFAULT 0`       | Shared stock across all variants      |
| `is_active`   | `boolean DEFAULT true`    | Soft delete                           |
| `created_at`  | `timestamp DEFAULT now()` |                                       |
| `updated_at`  | `timestamp DEFAULT now()` |                                       |

> **Note**: No `image_url` column (moved to `product_images`). No `category` column (moved to join table).

### `categories`

| Column       | Type                           | Notes                                     |
| ------------ | ------------------------------ | ----------------------------------------- |
| `id`         | `serial PRIMARY KEY`           |                                           |
| `name`       | `varchar(100) UNIQUE NOT NULL` | e.g., "Electronics", "Clothing", "Sports" |
| `created_at` | `timestamp DEFAULT now()`      |                                           |

### `product_categories` (JOIN TABLE — many-to-many)

| Column        | Type                                                           | Notes         |
| ------------- | -------------------------------------------------------------- | ------------- |
| `product_id`  | `integer NOT NULL REFERENCES products(id) ON DELETE CASCADE`   |               |
| `category_id` | `integer NOT NULL REFERENCES categories(id) ON DELETE CASCADE` |               |
| **PK**        | `PRIMARY KEY (product_id, category_id)`                        | Composite key |

### `product_images`

| Column          | Type                                                         | Notes                                |
| --------------- | ------------------------------------------------------------ | ------------------------------------ |
| `id`            | `serial PRIMARY KEY`                                         |                                      |
| `product_id`    | `integer NOT NULL REFERENCES products(id) ON DELETE CASCADE` |                                      |
| `image_url`     | `text NOT NULL`                                              | Cloudinary URL                       |
| `display_order` | `integer DEFAULT 0`                                          | Sort order (0 = primary/first image) |
| `created_at`    | `timestamp DEFAULT now()`                                    |                                      |

### `product_variants`

| Column       | Type                                                         | Notes                                           |
| ------------ | ------------------------------------------------------------ | ----------------------------------------------- |
| `id`         | `serial PRIMARY KEY`                                         |                                                 |
| `product_id` | `integer NOT NULL REFERENCES products(id) ON DELETE CASCADE` |                                                 |
| `name`       | `varchar(100) NOT NULL`                                      | e.g., "Red", "Blue", "Green" (or "S", "M", "L") |
| `created_at` | `timestamp DEFAULT now()`                                    |                                                 |

> **Note**: Variants share the parent product's `price` and `stock`. No individual variant pricing or images.

### `cart_items`

| Column       | Type                                                         | Notes                                  |
| ------------ | ------------------------------------------------------------ | -------------------------------------- |
| `id`         | `serial PRIMARY KEY`                                         |                                        |
| `user_id`    | `integer NOT NULL REFERENCES users(id) ON DELETE CASCADE`    |                                        |
| `product_id` | `integer NOT NULL REFERENCES products(id) ON DELETE CASCADE` |                                        |
| `variant_id` | `integer REFERENCES product_variants(id) ON DELETE SET NULL` | Nullable — NULL if no variant selected |
| `quantity`   | `integer NOT NULL DEFAULT 1`                                 |                                        |
| `created_at` | `timestamp DEFAULT now()`                                    |                                        |

### `orders`

| Column                     | Type                                    | Notes                                  |
| -------------------------- | --------------------------------------- | -------------------------------------- |
| `id`                       | `serial PRIMARY KEY`                    |                                        |
| `user_id`                  | `integer NOT NULL REFERENCES users(id)` |                                        |
| `total_amount`             | `numeric(10, 2) NOT NULL`               |                                        |
| `status`                   | `varchar(50) DEFAULT 'pending'`         | pending, paid, shipped, cancelled      |
| `stripe_payment_intent_id` | `varchar(255)`                          |                                        |
| `shipping_address`         | `jsonb`                                 | e.g., `{ street, city, zip, country }` |
| `created_at`               | `timestamp DEFAULT now()`               |                                        |
| `updated_at`               | `timestamp DEFAULT now()`               |                                        |

### `order_items`

| Column         | Type                                                         | Notes                                        |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `id`           | `serial PRIMARY KEY`                                         |                                              |
| `order_id`     | `integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE`   |                                              |
| `product_id`   | `integer NOT NULL REFERENCES products(id)`                   |                                              |
| `variant_id`   | `integer REFERENCES product_variants(id) ON DELETE SET NULL` | Nullable                                     |
| `variant_name` | `varchar(100)`                                               | Snapshot of variant name at time of purchase |
| `quantity`     | `integer NOT NULL`                                           |                                              |
| `unit_price`   | `numeric(10, 2) NOT NULL`                                    | Price at time of purchase                    |
| `created_at`   | `timestamp DEFAULT now()`                                    |                                              |

---

## 📁 Folder Structure

```
Ecommerce Pern/
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts              # Drizzle + Neon connection
│   │   │   ├── schema.ts             # All 8 table definitions
│   │   │   └── seed.ts               # Sample data seeder
│   │   ├── controllers/              # Business logic (called by routes)
│   │   │   ├── authController.ts     # Clerk webhook handling, /me
│   │   │   ├── productController.ts  # Product CRUD logic
│   │   │   ├── categoryController.ts # Category CRUD logic
│   │   │   ├── cartController.ts     # Cart CRUD logic
│   │   │   ├── orderController.ts    # Checkout + order logic
│   │   │   ├── adminController.ts    # Analytics + order management
│   │   │   └── uploadController.ts   # Image upload logic
│   │   ├── middleware/
│   │   │   ├── upload.ts             # Multer config → Cloudinary
│   │   │   └── admin.ts              # Clerk public_metadata role check
│   │   ├── routes/                   # Route definitions only (thin layer)
│   │   │   ├── auth.ts               # /me, /webhooks/clerk
│   │   │   ├── products.ts           # Public GET + Admin CRUD
│   │   │   ├── categories.ts         # Category CRUD
│   │   │   ├── cart.ts               # Cart CRUD (auth required)
│   │   │   ├── orders.ts             # Checkout + order history
│   │   │   ├── admin.ts              # Analytics + order management
│   │   │   └── upload.ts             # Multi-image upload endpoint
│   │   ├── utils/
│   │   │   ├── stripe.ts             # Stripe SDK init + helpers
│   │   │   ├── cloudinary.ts         # Cloudinary upload helper
│   │   │   └── validation.ts         # Zod schemas for all request bodies
│   │   └── index.ts                  # Express app entry point
│   ├── uploads/                      # Temp Multer buffer
│   ├── .env
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── api/                      # Axios instance + API call functions
│   │   │   ├── axios.ts
│   │   │   ├── products.ts
│   │   │   ├── categories.ts
│   │   │   ├── cart.ts
│   │   │   ├── orders.ts
│   │   │   └── admin.ts
│   │   ├── hooks/                    # TanStack Query hooks (NEW)
│   │   │   ├── useProducts.ts
│   │   │   ├── useCategories.ts
│   │   │   ├── useOrders.ts
│   │   │   ├── useCheckout.ts
│   │   │   └── useAdmin.ts
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── layout/               # Navbar, Footer, AdminSidebar
│   │   │   ├── products/             # ProductCard, ProductGrid, ImageGallery
│   │   │   ├── cart/                 # CartItem, CartSummary
│   │   │   └── admin/                # StatCard, Charts, DataTable
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── OrderSuccess.tsx
│   │   │   ├── Orders.tsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Products.tsx
│   │   │       └── Orders.tsx
│   │   ├── store/                    # Zustand stores
│   │   │   └── cartStore.ts
│   │   ├── lib/                      # Utility functions
│   │   │   └── utils.ts
│   │   ├── types/                    # TypeScript interfaces
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── .env
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ✅ Zod Validation Schemas

Zod is used to validate all incoming request bodies. Each controller imports its schemas from `utils/validation.ts`.

### Validation Schemas Defined

| Schema                    | Validates                        | Rules                                                                                                                                                                              |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createProductSchema`     | POST /api/products               | `name` (string, 1-255), `description` (string, optional), `price` (number, positive), `stock` (integer, >= 0), `categoryIds` (array of numbers), `variantNames` (array of strings) |
| `updateProductSchema`     | PUT /api/products/:id            | All fields optional, same rules as create                                                                                                                                          |
| `createCategorySchema`    | POST /api/categories             | `name` (string, 1-100)                                                                                                                                                             |
| `updateCategorySchema`    | PUT /api/categories/:id          | `name` (string, 1-100)                                                                                                                                                             |
| `addCartItemSchema`       | POST /api/cart                   | `product_id` (number), `quantity` (integer, >= 1), `variant_id` (number, optional)                                                                                                 |
| `updateCartItemSchema`    | PUT /api/cart/:id                | `quantity` (integer, >= 1)                                                                                                                                                         |
| `createOrderSchema`       | POST /api/orders                 | `payment_intent_id` (string), `shipping_address` (object with street, city, zip, country)                                                                                          |
| `updateOrderStatusSchema` | PUT /api/admin/orders/:id/status | `status` (enum: pending, paid, shipped, cancelled)                                                                                                                                 |
| `clerkWebhookSchema`      | POST /api/webhooks/clerk         | `type` (string), `data` (object with id, email_addresses, first_name, last_name)                                                                                                   |

### Validation Middleware Pattern

```typescript
// src/middleware/validate.ts
import { z } from "zod";

export const validate = (schema: z.ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};
```

This `validate` middleware is used in every route definition like:

```typescript
router.post(
  "/",
  requireAdmin,
  validate(createProductSchema),
  productController.create,
);
```

---

## 🔐 Authentication Architecture (Clerk)

### Flow:

1. **Frontend**: Clerk's `<SignUp />` / `<SignIn />` components handle the UI
2. **Clerk Webhook**: On `user.created` and `user.updated`, Clerk POSTs to `POST /api/webhooks/clerk`
3. **Backend Webhook Handler**: Verifies `svix` signature → upserts user into `users` table (clerk_id, email, name)
4. **Backend Auth Middleware**: `@clerk/express` `requireAuth()` protects routes → `req.auth.userId` available
5. **Admin Middleware**: Reads `req.auth.sessionClaims.publicMetadata.role` → if not `"admin"` → 403
6. **Role Assignment**: Manually set `public_metadata: { role: "admin" }` in Clerk dashboard for admin users

### Clerk Webhook Events Handled:

- `user.created` → INSERT into `users`
- `user.updated` → UPDATE `users` (email, name)

---

## 🌐 API Routes Reference

### Auth Routes (`/api`)

| Method | Path                  | Auth                 | Description                  |
| ------ | --------------------- | -------------------- | ---------------------------- |
| `GET`  | `/api/auth/me`        | Required             | Returns current user profile |
| `POST` | `/api/webhooks/clerk` | None (svix verified) | Clerk webhook receiver       |

### Category Routes (`/api/categories`)

| Method   | Path                  | Auth  | Description                             |
| -------- | --------------------- | ----- | --------------------------------------- |
| `GET`    | `/api/categories`     | None  | List all categories                     |
| `POST`   | `/api/categories`     | Admin | Create a new category                   |
| `PUT`    | `/api/categories/:id` | Admin | Update category name                    |
| `DELETE` | `/api/categories/:id` | Admin | Delete category (if no products linked) |

### Product Routes (`/api/products`)

| Method   | Path                | Auth  | Description                                                                                                                |
| -------- | ------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/products`     | None  | Paginated product list, filterable by `?category=&search=`. Returns products with `images[]`, `variants[]`, `categories[]` |
| `GET`    | `/api/products/:id` | None  | Single product with all relations (images, variants, categories)                                                           |
| `POST`   | `/api/products`     | Admin | Create product with up to 5 images (multipart), variant names array, category IDs array                                    |
| `PUT`    | `/api/products/:id` | Admin | Update product fields, manage images/variants/categories                                                                   |
| `DELETE` | `/api/products/:id` | Admin | Soft delete (sets `is_active = false`)                                                                                     |

### Upload Route (`/api/upload`)

| Method | Path          | Auth  | Description                                                         |
| ------ | ------------- | ----- | ------------------------------------------------------------------- |
| `POST` | `/api/upload` | Admin | Upload multiple images (up to 5) → returns array of Cloudinary URLs |

### Cart Routes (`/api/cart`)

| Method   | Path            | Auth     | Description                                                    |
| -------- | --------------- | -------- | -------------------------------------------------------------- |
| `GET`    | `/api/cart`     | Required | Get user's cart with product details, images, selected variant |
| `POST`   | `/api/cart`     | Required | Add item (`product_id`, `quantity`, `variant_id` optional)     |
| `PUT`    | `/api/cart/:id` | Required | Update item quantity (or change variant)                       |
| `DELETE` | `/api/cart/:id` | Required | Remove single item                                             |
| `DELETE` | `/api/cart`     | Required | Clear entire cart                                              |

### Order Routes (`/api/orders`)

| Method | Path              | Auth     | Description                                                |
| ------ | ----------------- | -------- | ---------------------------------------------------------- |
| `POST` | `/api/orders`     | Required | Create order after payment (clears cart, decrements stock) |
| `GET`  | `/api/orders`     | Required | User's order history                                       |
| `GET`  | `/api/orders/:id` | Required | Single order with items (including variant_name snapshots) |

### Checkout Route (`/api/checkout`)

| Method | Path                                  | Auth     | Description                                                  |
| ------ | ------------------------------------- | -------- | ------------------------------------------------------------ |
| `POST` | `/api/checkout/create-payment-intent` | Required | Creates Stripe PaymentIntent from cart, returns clientSecret |

### Webhook Routes (`/api/webhooks`)

| Method | Path                   | Auth                    | Description                                           |
| ------ | ---------------------- | ----------------------- | ----------------------------------------------------- |
| `POST` | `/api/webhooks/stripe` | None (stripe-signature) | Handles `payment_intent.succeeded` → marks order paid |

### Admin Routes (`/api/admin`)

| Method | Path                           | Auth  | Description                                                                              |
| ------ | ------------------------------ | ----- | ---------------------------------------------------------------------------------------- |
| `GET`  | `/api/admin/stats`             | Admin | Dashboard stats (totalRevenue, totalOrders, totalCustomers, revenue30Days, orders30Days) |
| `GET`  | `/api/admin/revenue-trend`     | Admin | Day-by-day revenue for last 7 days                                                       |
| `GET`  | `/api/admin/top-products`      | Admin | Top 5 products by units sold                                                             |
| `GET`  | `/api/admin/recent-orders`     | Admin | Latest 10 orders with customer info                                                      |
| `GET`  | `/api/admin/orders`            | Admin | All orders (paginated, filterable by status)                                             |
| `PUT`  | `/api/admin/orders/:id/status` | Admin | Update order status                                                                      |

---

## 📦 Environment Variables

### `server/.env`

```env
DATABASE_URL=postgresql://...                # Neon connection string
CLERK_SECRET_KEY=sk_...                      # Clerk secret key
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...       # Clerk webhook signing secret
STRIPE_SECRET_KEY=sk_test_...                # Stripe test secret key
STRIPE_WEBHOOK_SECRET=whsec_...              # Stripe webhook signing secret
CLOUDINARY_CLOUD_NAME=                       # Cloudinary cloud name
CLOUDINARY_API_KEY=                          # Cloudinary API key
CLOUDINARY_API_SECRET=                       # Cloudinary API secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

### `client/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...       # Clerk publishable key
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...      # Stripe publishable key
```

---

## 🗓️ DAY-BY-DAY TASK BREAKDOWN

---

### 🔵 DAY 1 — Foundation & Database

**Goal**: Working Express server with Neon + Drizzle ORM. All **8 tables** created and seeded.

| Step | Task                               | Details                                                                                                                                                                                                                                                                  |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1  | **Initialize root package.json**   | `npm init -y` at `/Ecommerce Pern`. Add workspace scripts.                                                                                                                                                                                                               |
| 1.2  | **Create `/server` directory**     | `mkdir -p server/src/{db,controllers,middleware,routes,utils}`                                                                                                                                                                                                           |
| 1.3  | **Initialize server package.json** | `npm init -y` inside `/server`. Install: `express`, `cors`, `dotenv`, `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `@clerk/express`, `svix`, `stripe`, `cloudinary`, `multer`, `zod`, `tsx`, `typescript`, `@types/express`, `@types/cors`, `@types/multer` |

| 1.4 | **Create `tsconfig.json`** | Target ES2022, module NodeNext, outDir dist, rootDir src |
| 1.5 | **Create `drizzle.config.ts`** | Point to `src/db/schema.ts`, output to `./drizzle`, driver `@neondatabase/serverless`, dbCredentials from `DATABASE_URL` env |
| 1.6 | **Create `src/db/index.ts`** | Initialize Drizzle with `@neondatabase/serverless` `Pool` and `drizzle()` |
| 1.7 | **Create `src/db/schema.ts`** | Define all **8 tables** with Drizzle `pgTable` and proper relations: `users`, `products`, `categories`, `product_categories`, `product_images`, `product_variants`, `cart_items`, `orders`, `order_items` |
| 1.8 | **Create `server/.env`** | Add all env vars (Neon, Clerk, Stripe, Cloudinary, PORT, CLIENT_URL) — use placeholder values |
| 1.9 | **Run `npx drizzle-kit push`** | Push schema to Neon — creates all 8 tables with foreign keys |
| 1.10 | **Create `src/db/seed.ts`** | Insert: 5 categories (Electronics, Clothing, Sports, Home, Books), 8 products (each with 2-3 images, 2-3 variants, 1-2 categories), 1 admin user record. Example: "Classic Cotton T-Shirt" (Clothing) with variants "Red", "Blue", "Green", 3 product_images |
| 1.11 | **Run seed script** | `npx tsx src/db/seed.ts` |
| 1.12 | **Create `src/index.ts`** | Express app: cors (origin CLIENT_URL), JSON body parser, health route `GET /api/health` (returns DB product count + table counts), listen on PORT |
| 1.13 | **Test via Postman** | `GET http://localhost:5000/api/health` → `{ status: "ok", products: 8, categories: 5, images: ~20, variants: ~20 }` |
| 1.14 | **Git commit** | `git add -A && git commit -m "Day 1: Foundation — Express, Neon, Drizzle, 8 schemas, seed data"` |

---

### 🔵 DAY 2 — Authentication (Clerk + Webhook)

**Goal**: Clerk webhook syncs users to DB. Auth and admin middleware functional. Testable via Postman.

| Step | Task                                 | Details                                                                                                                                                                                                                                                           |
| ---- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | **Add Clerk Express middleware**     | Import `clerkMiddleware` from `@clerk/express`, apply globally in `src/index.ts`                                                                                                                                                                                  |
| 2.2  | **Create `src/utils/validation.ts`** | Define Zod schemas: `clerkWebhookSchema`. Create `src/middleware/validate.ts` — generic `validate(schema)` middleware that calls `safeParse()` and returns 400 with field errors on failure                                                                       |
| 2.3  | **Create `src/routes/auth.ts`**      | `GET /api/auth/me` — `requireAuth()` → returns `req.auth` + DB user record                                                                                                                                                                                        |
| 2.4  | **Create webhook route**             | `POST /api/webhooks/clerk` — parse raw body (disable JSON middleware for this route), verify `svix` signature using `CLERK_WEBHOOK_SIGNING_SECRET`, validate body with `clerkWebhookSchema`, handle `user.created` and `user.updated` → upsert into `users` table |

| 2.5 | **Create `src/middleware/admin.ts`** | Export `requireAdmin` middleware: reads `req.auth.sessionClaims.publicMetadata.role`, if not `"admin"` → `403 { error: "Admin access required" }` |
| 2.6 | **Mount routes in `src/index.ts`** | `/api/auth`, `/api/webhooks/clerk` |
| 2.7 | **Start server + set up Clerk webhook** | In Clerk Dashboard → Webhooks → add endpoint → select `user.created` and `user.updated` events (use ngrok for local dev if needed) |
| 2.8 | **Test via Postman** | Register a user via Clerk → webhook fires → verify `users` row created in Neon. Call `GET /api/auth/me` with Clerk session token → returns user. Call admin route with non-admin → 403. Set user's `public_metadata.role = "admin"` in Clerk Dashboard → admin route → 200. |
| 2.9 | **Git commit** | `git commit -m "Day 2: Clerk auth — webhook sync, auth middleware, admin role check"` |

---

### 🔵 DAY 3 — Categories, Products CRUD + Multi-Image Upload

**Goal**: Full category & product management. Public can browse with filters. Admin can CRUD with multiple images, variants, and categories. All tested in Postman.

| Step | Task                                             | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1  | **Add Zod schemas to `src/utils/validation.ts`** | Add `createProductSchema`, `updateProductSchema`, `createCategorySchema`, `updateCategorySchema` with proper validation rules                                                                                                                                                                                                                                                                                                                                              |
| 3.2  | **Create `src/utils/cloudinary.ts`**             | Configure Cloudinary SDK with env vars. Export `uploadToCloudinary(fileBuffer)` → `{ url, public_id }`. Export `uploadMultiple(files[])` → `[{ url, public_id }]`                                                                                                                                                                                                                                                                                                          |
| 3.3  | **Create `src/middleware/upload.ts`**            | Multer config: `memoryStorage()`, 5MB per file limit, up to 5 files, image filter (jpg, png, webp). Export `upload.array('images', 5)` middleware                                                                                                                                                                                                                                                                                                                          |
| 3.4  | **Create `src/routes/upload.ts`**                | `POST /api/upload` — admin-only, uses Multer middleware, uploads all to Cloudinary, returns `{ urls: ["...", "..."] }`                                                                                                                                                                                                                                                                                                                                                     |
| 3.5  | **Create `src/routes/categories.ts`**            | `GET /api/categories` — list all. `POST /api/categories` — admin, create with `validate(createCategorySchema)`. `PUT /api/categories/:id` — admin, update with `validate(updateCategorySchema)`. `DELETE /api/categories/:id` — admin, delete if no products linked                                                                                                                                                                                                        |
| 3.6  | **Create `src/routes/products.ts`** — Public     | `GET /api/products` — pagination (`?page=&limit=`), filter by `?category=` (category ID), `?search=` (name/description). Only `is_active = true`. Returns each product with: `images[]` array, `variants[]` array, `categories[]` array                                                                                                                                                                                                                                    |
| 3.7  |                                                  | `GET /api/products/:id` — returns single product with all images, variants, categories. 404 if not found or inactive                                                                                                                                                                                                                                                                                                                                                       |
| 3.8  | **Create `src/routes/products.ts`** — Admin      | `POST /api/products` — multipart/form-data. Fields: `name`, `description`, `price`, `stock`, `categoryIds` (JSON array string), `variantNames` (JSON array string), `images` (up to 5 files). Validate text fields with `createProductSchema` after parsing JSON strings. Uploads images to Cloudinary → creates product → creates `product_images` rows → creates `product_variants` rows → creates `product_categories` rows. Returns created product with all relations |
| 3.9  |                                                  | `PUT /api/products/:id` — admin. Updates product fields + manages images (add/remove by URL), variants (add/remove by name), categories (sync IDs). Validate with `updateProductSchema`. Returns updated product                                                                                                                                                                                                                                                           |
| 3.10 |                                                  | `DELETE /api/products/:id` — admin. Sets `is_active = false`. Returns `{ message: "Product deleted" }`                                                                                                                                                                                                                                                                                                                                                                     |
| 3.11 | **Mount routes**                                 | `/api/products`, `/api/categories`, `/api/upload`                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3.12 | **Test via Postman**                             | Create product with 3 images + 3 variants + 2 categories → verify all joined tables populated. GET all → verify pagination + filters. GET by ID → verify nested relations. Update → verify changes. Soft delete → verify excluded from public GET. CRUD categories. Test Zod validation: send invalid data → expect 400 with field errors                                                                                                                                  |
| 3.13 | **Git commit**                                   | `git commit -m "Day 3: Categories, Products CRUD, multi-image upload, variants, Zod validation"`                                                                                                                                                                                                                                                                                                                                                                           |

---

### 🔵 DAY 4 — Cart + Orders + Stripe Checkout (Backend)

**Goal**: Working cart with variant support, Stripe payment intent creation, order creation with variant snapshots, and Stripe webhook handling.

| Step | Task                                             | Details                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1  | **Add Zod schemas to `src/utils/validation.ts`** | Add `addCartItemSchema`, `updateCartItemSchema`, `createOrderSchema`                                                                                                                                                                                                                                                                                                          |
| 4.2  | **Create `src/routes/cart.ts`**                  | `GET /api/cart` — auth required. Joins `cart_items` + `products` + optional `product_variants`. Groups by product. Returns `{ items: [{ id, product (with first image), variant (name, id or null), quantity }] }`                                                                                                                                                            |
| 4.3  |                                                  | `POST /api/cart` — body: `{ product_id, quantity, variant_id? }`. Uses `validate(addCartItemSchema)`. Validates product exists & `is_active`. If same product + same variant already in cart → increment quantity. Otherwise → insert new row                                                                                                                                 |
| 4.4  |                                                  | `PUT /api/cart/:id` — body: `{ quantity }`. Uses `validate(updateCartItemSchema)`. Updates cart item quantity. If quantity ≤ 0 → remove item                                                                                                                                                                                                                                  |
| 4.4  |                                                  | `DELETE /api/cart/:id` — removes specific cart item                                                                                                                                                                                                                                                                                                                           |
| 4.5  |                                                  | `DELETE /api/cart` — clears all cart items for user                                                                                                                                                                                                                                                                                                                           |
| 4.6  | **Create `src/utils/stripe.ts`**                 | Initialize Stripe with `STRIPE_SECRET_KEY`. Export stripe instance                                                                                                                                                                                                                                                                                                            |
| 4.7  | **Create checkout route**                        | `POST /api/checkout/create-payment-intent` — auth required. Fetches user's cart with product details, calculates total, creates Stripe PaymentIntent with `amount` (in cents) and `currency: "eur"`. Returns `{ clientSecret }`                                                                                                                                               |
| 4.9  | **Create `src/routes/orders.ts`**                | `POST /api/orders` — body: `{ payment_intent_id, shipping_address }`. Uses `validate(createOrderSchema)`. Validates payment intent with Stripe. Creates `orders` row. Creates `order_items` rows (copying `unit_price`, `variant_id`, `variant_name` from products/variants at time of order). Decrements product stock. Clears user's cart. Returns created order with items |
| 4.9  |                                                  | `GET /api/orders` — user's orders, newest first, with item count                                                                                                                                                                                                                                                                                                              |
| 4.10 |                                                  | `GET /api/orders/:id` — single order with `order_items` joined (including `variant_name` snapshot)                                                                                                                                                                                                                                                                            |
| 4.11 | **Create Stripe webhook route**                  | `POST /api/webhooks/stripe` — verify stripe signature. On `payment_intent.succeeded` → update order status to `"paid"`. Use raw body parser for this route                                                                                                                                                                                                                    |
| 4.12 | **Mount routes**                                 | `/api/cart`, `/api/checkout`, `/api/orders`, `/api/webhooks/stripe`                                                                                                                                                                                                                                                                                                           |
| 4.13 | **Test via Postman**                             | Add items to cart (with and without variants) → GET cart (verify variant info). Create payment intent. Simulate order creation → verify order + items in DB (including variant_name snapshots), stock decremented, cart cleared                                                                                                                                               |
| 4.14 | **Git commit**                                   | `git commit -m "Day 4: Cart with variants, Stripe checkout, order creation, Stripe webhook"`                                                                                                                                                                                                                                                                                  |

---

### 🔵 DAY 5 — Admin Analytics + Order Management (Backend)

**Goal**: All admin analytics endpoints working. Order management (list all, update status). Backend 100% complete.

| Step | Task                                               | Details                                                                                                                                                                                                                                                                                       |
| ---- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1  | **Create `src/routes/admin.ts`**                   | `GET /api/admin/stats` — SQL aggregations: `SUM(orders.total_amount)` as totalRevenue, `COUNT(orders.id)` as totalOrders, `COUNT(users.id)` as totalCustomers, plus 30-day variants using `WHERE created_at >= NOW() - INTERVAL '30 days'`                                                    |
| 5.2  |                                                    | `GET /api/admin/revenue-trend` — day-by-day revenue for last 7 days (excludes cancelled orders)                                                                                                                                                                                               |
| 5.3  |                                                    | `GET /api/admin/top-products` — top 5 products by total units sold, join `order_items` → `products`                                                                                                                                                                                           |
| 5.4  |                                                    | `GET /api/admin/recent-orders` — latest 10 orders with user name/email, item count, total                                                                                                                                                                                                     |
| 5.5  |                                                    | `GET /api/admin/orders` — all orders paginated, filterable by `?status=`, with user info                                                                                                                                                                                                      |
| 5.6  |                                                    | `PUT /api/admin/orders/:id/status` — body: `{ status }`. Uses `validate(updateOrderStatusSchema)`. Updates order status. Validates valid status transitions                                                                                                                                   |
| 5.7  | **All admin routes use `requireAdmin` middleware** | Wrap every route with `requireAdmin` — non-admins get 403                                                                                                                                                                                                                                     |
| 5.8  | **Mount** `/api/admin`                             |                                                                                                                                                                                                                                                                                               |
| 5.9  | **Test via Postman**                               | Verify all stats calculations. Test revenue trend. Test top products. Test order status updates. Verify non-admin gets 403 on all routes. Test Zod validation on every endpoint: send invalid data → expect 400 with clear field error messages. **All 25+ backend endpoints now functional** |
| 5.10 | **Git commit**                                     | `git commit -m "Day 5: Admin analytics, order management. Backend 100% complete!"`                                                                                                                                                                                                            |

---

### 🔵 DAY 6 — Frontend: Setup, Auth, Products, Cart

**Goal**: User-facing frontend functional. TanStack Query handles all server-state (products, categories, orders, admin data). Zustand handles cart state. Axios is the HTTP client used by both TanStack Query hooks and Zustand actions.

| Step | Task                             | Details                                                                                                                                                                                                                                                                  |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6.1  | **Scaffold `/client` with Vite** | `npm create vite@latest client -- --template react-ts`                                                                                                                                                                                                                   |
| 6.2  | **Install dependencies**         | `tailwindcss`, `@tailwindcss/vite`, `lucide-react`, `zustand`, `@tanstack/react-query`, `@clerk/clerk-react`, `@stripe/stripe-js`, `@stripe/react-stripe-js`, `axios`, `react-router-dom`, `recharts`, `clsx`, `tailwind-merge`                                          |
| 6.3  | **Configure Tailwind + Vite**    | Add `@tailwindcss/vite` plugin, set up `index.css` with Tailwind directives                                                                                                                                                                                              |
| 6.4  | **Init shadcn/ui**               | `npx shadcn@latest init` — select Tailwind v4, CSS variables, zinc color                                                                                                                                                                                                 |
| 6.5  | **Install shadcn components**    | Button, Input, Card, Badge, Table, Dialog, Select, Sheet, Avatar, DropdownMenu, Tabs, Skeleton                                                                                                                                                                           |
| 6.6  | **Set up Providers**             | `main.tsx`: Wrap `<App>` with `<ClerkProvider publishableKey={...}>` and `<QueryClientProvider client={queryClient}>`. Add `<SignedIn>`, `<SignedOut>`, `<RedirectToSignIn />`                                                                                           |
| 6.7  | **Set up React Router**          | Routes: `/` (Home), `/products`, `/products/:id`, `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/admin/*` (protected)                                                                                                                                                 |
| 6.8  | **Create Axios instance**        | `api/axios.ts` — base URL from env, request interceptor attaches Clerk session token via `getToken()`                                                                                                                                                                    |
| 6.9  | **Create API modules**           | `api/products.ts`, `api/categories.ts`, `api/cart.ts`, `api/orders.ts`, `api/admin.ts` — typed functions for all endpoints                                                                                                                                               |
| 6.10 | **Create QueryClient config**    | `lib/queryClient.ts` — export `queryClient` with `defaultOptions`: `staleTime: 5 * 60 * 1000` (5 min), `gcTime: 30 * 60 * 1000` (30 min), `retry: 1`                                                                                                                     |
| 6.11 | **Create TypeScript types**      | `types/index.ts` — `Product`, `ProductImage`, `ProductVariant`, `Category`, `CartItem`, `Order`, `OrderItem`, `AdminStats`                                                                                                                                               |
| 6.12 | **Create TanStack Query hooks**  | `hooks/useProducts.ts` — `useProducts(filters)` (GET list, queryKey includes filters), `useProduct(id)` (GET by ID). Use `keepPreviousData` for paginated lists                                                                                                          |
| 6.13 |                                  | `hooks/useCategories.ts` — `useCategories()` (GET all)                                                                                                                                                                                                                   |
| 6.14 |                                  | `hooks/useOrders.ts` — `useOrders()` (GET user orders), `useOrder(id)` (GET single order), `useCreateOrder()` (mutation, invalidates `['orders']` and `['cart']` on success)                                                                                             |
| 6.15 |                                  | `hooks/useCheckout.ts` — `useCreatePaymentIntent()` (mutation, requires cart data)                                                                                                                                                                                       |
| 6.16 |                                  | `hooks/useAdmin.ts` — `useAdminStats()`, `useRevenueTrend()`, `useTopProducts()`, `useRecentOrders()`, `useAdminOrders(filters)`, `useUpdateOrderStatus()` (mutation)                                                                                                    |
| 6.17 | **Create Zustand cart store**    | `store/cartStore.ts` — `items`, `loading`, `fetchCart()`, `addToCart(productId, quantity, variantId?)`, `updateQuantity()`, `removeItem()`, `clearCart()`, computed: `cartTotal`, `cartCount`. Cart actions call `api/cart.ts` functions directly                        |
| 6.18 | **Create Layout components**     | `components/layout/Navbar.tsx` — logo, nav links (Products, Categories), cart icon with badge (reads from Zustand `cartCount`), Clerk `<UserButton />`. `components/layout/Footer.tsx`                                                                                   |
| 6.19 | **Create product components**    | `components/products/ProductCard.tsx` — first image thumbnail, name, price, "Add to Cart" button. `components/products/ProductGrid.tsx` — responsive grid layout. `components/products/ImageGallery.tsx` — main image + thumbnails (for detail page)                     |
| 6.20 | **Create Pages**                 | `pages/Home.tsx` — hero banner, featured products grid (using `useProducts({})`), category links (using `useCategories()`)                                                                                                                                               |
| 6.21 |                                  | `pages/Products.tsx` — product grid, category filter sidebar (checkboxes, since many-to-many), search bar, pagination. Uses `useProducts({ category, search, page })` with `keepPreviousData`                                                                            |
| 6.22 |                                  | `pages/ProductDetail.tsx` — image gallery (multiple images with thumbnails), name, description, price, stock, **variant selector** (buttons for each variant: "Red", "Blue", "Green"), quantity selector, "Add to Cart" button. Uses `useProduct(id)`                    |
| 6.23 |                                  | `pages/Cart.tsx` — cart items list showing product image, name, selected variant (if any), +/- quantity controls, remove button, subtotal/total, "Proceed to Checkout" button. Reads from Zustand `useCartStore()`, actions call Zustand methods which hit `api/cart.ts` |
| 6.24 | **Test in browser**              | Browse products → filter by categories. Product detail → view image gallery → select variant → add to cart. Cart → adjust quantities → remove. Verify cart persists across page refreshes                                                                                |
| 6.25 | **Git commit**                   | `git commit -m "Day 6: Frontend — Clerk auth, TanStack Query, product browsing with images & variants, Zustand cart"`                                                                                                                                                    |

---

### 🔵 DAY 7 — Frontend: Checkout, Admin Dashboard, Polish

**Goal**: Full end-to-end flow complete. Stripe checkout works. Admin dashboard with analytics and CRUD management.

| Step | Task                        | Details                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7.1  | **Checkout page**           | `pages/Checkout.tsx` — Stripe `Elements` + `CardElement`. Shipping address form. Uses `useCreatePaymentIntent()` (TanStack Query mutation) to create PaymentIntent from Zustand cart. On submit → Stripe `confirmPayment()` → on success call `useCreateOrder()` mutation → redirect to success page                                                                           |
| 7.2  | **Order success page**      | `pages/OrderSuccess.tsx` — shows order confirmation with order summary                                                                                                                                                                                                                                                                                                         |
| 7.3  | **Order history page**      | `pages/Orders.tsx` — table of orders with status badges (pending=orange, paid=green, shipped=blue, cancelled=red), date, total. Expand row to see items with variant names. Uses `useOrders()` hook                                                                                                                                                                            |
| 7.4  | **Create admin components** | `components/admin/StatCard.tsx` — icon, label, formatted value. `components/admin/AdminSidebar.tsx` — nav links (Dashboard, Products, Orders)                                                                                                                                                                                                                                  |
| 7.5  | **Admin Dashboard page**    | `pages/admin/Dashboard.tsx` — 4 stat cards (Total Revenue, Total Orders, Total Customers, 30-Day Revenue). Revenue trend line chart (Recharts). Top 5 products table (name + units sold). Recent 10 orders table. Uses `useAdminStats()`, `useRevenueTrend()`, `useTopProducts()`, `useRecentOrders()` hooks                                                                   |
| 7.6  | **Admin Products page**     | `pages/admin/Products.tsx` — table (image thumbnail, name, price, stock, categories, status). "Add Product" button → Dialog form: name, description, price, stock → multi-image upload → category multi-select → variant names input (comma-separated). Edit button → pre-filled dialog. Delete → soft delete. Uses TanStack Query mutations + `useQueryClient()` invalidation |
| 7.7  | **Admin Orders page**       | `pages/admin/Orders.tsx` — table (order ID, customer, date, total, status). Click row → expand detail (items, shipping address). Status dropdown → calls `useUpdateOrderStatus()` mutation which invalidates `['adminOrders']` and `['order']`                                                                                                                                 |
| 7.8  | **Admin route protection**  | Check `publicMetadata.role === "admin"` from Clerk's `useUser()`. If not admin → redirect to `/` with toast                                                                                                                                                                                                                                                                    |
| 7.9  | **Polish**                  | Responsive design check (mobile menu, grids). Loading states (Skeleton components + TanStack Query `isPending`/`isFetching`). Error states (toast notifications + TanStack Query `isError`). Empty states ("No items in cart", "No orders yet", "No products found")                                                                                                           |
| 7.10 | **Full E2E walkthrough**    | Register → browse products (filter by categories, view image gallery, select variant) → add to cart → checkout with Stripe test card (`4242 4242 4242 4242`) → redirect to success → view order history (verify variant names shown). Login as admin → dashboard with real data → CRUD a product with images + variants + categories → view/manage orders                      |
| 7.11 | **Update README.md**        | Project overview, tech stack, setup instructions (clone, env vars, install, run migrations, seed, start), available scripts, API reference link                                                                                                                                                                                                                                |
| 7.12 | **Git commit + push**       | `git add -A && git commit -m "Day 7: Checkout with Stripe, Admin Dashboard, polished. MVP complete!" && git push origin main`                                                                                                                                                                                                                                                  |

---

## 🧪 Stripe Test Card

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
```

---

## 📊 Seed Data Preview (8 Products)

| #   | Product                       | Category          | Price   | Variants            | Images |
| --- | ----------------------------- | ----------------- | ------- | ------------------- | ------ |
| 1   | Classic Cotton T-Shirt        | Clothing          | €24.99  | Red, Blue, Green    | 3      |
| 2   | Wireless Bluetooth Headphones | Electronics       | €79.99  | Black, White        | 2      |
| 3   | Running Shoes Pro             | Sports, Clothing  | €129.99 | Black, White, Navy  | 3      |
| 4   | Smart Watch Ultra             | Electronics       | €249.99 | Silver, Black       | 2      |
| 5   | Yoga Mat Premium              | Sports            | €34.99  | Purple, Blue, Grey  | 2      |
| 6   | Leather Wallet                | Clothing          | €49.99  | Brown, Black        | 2      |
| 7   | Insulated Water Bottle        | Sports, Home      | €29.99  | White, Black, Green | 3      |
| 8   | Desk Lamp LED                 | Home, Electronics | €59.99  | Black, White        | 2      |

---

## 🔧 Useful Commands (for development)

```bash
# Start server (from /server)
npx tsx src/index.ts

# Start client (from /client)
npm run dev

# Push DB schema changes
npx drizzle-kit push

# Run seed script
npx tsx src/db/seed.ts
```
