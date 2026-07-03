## 📁 Folder Structure

```
Ecommerce Pern/
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts or /db.ts           # Drizzle + Neon connection
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
