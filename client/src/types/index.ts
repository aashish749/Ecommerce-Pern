export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  image_url?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  categories?: Category[];
}

export interface ProductImage {
  id: number;
  product_id?: number;
  productId?: number;
  image_url?: string;
  imageUrl?: string;
  display_order?: number;
  displayOrder?: number;
  created_at?: string;
  createdAt?: string;
}

export interface ProductVariant {
  id: number;
  product_id?: number;
  productId?: number;
  name: string;
  created_at?: string;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  created_at?: string;
  createdAt?: string;
}

export interface CartItem {
  id: number;
  user_id?: number;
  userId?: number;
  product_id?: number;
  productId?: number;
  variant_id?: number | null;
  variantId?: number | null;
  quantity: number;
  created_at?: string;
  createdAt?: string;
  product: Product;
  variant: ProductVariant | null;
}

export interface Order {
  id: number;
  user_id?: number;
  userId?: number;
  total_amount?: string;
  totalAmount?: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  stripe_payment_intent_id?: string | null;
  stripePaymentIntentId?: string | null;
  shipping_address?: ShippingAddress | null;
  shippingAddress?: ShippingAddress | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id?: number;
  orderId?: number;
  product_id?: number;
  productId?: number;
  variant_id?: number | null;
  variantId?: number | null;
  variant_name?: string | null;
  variantName?: string | null;
  quantity: number;
  unit_price?: string;
  unitPrice?: string;
  created_at?: string;
  createdAt?: string;
  productName?: string;
  productImageUrl?: string | null;
}

export interface ShippingAddress {
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface AdminStats {
  totalRevenue: string;
  totalOrders: number;
  totalCustomers: number;
  revenue30Days: string;
  orders30Days: number;
}

export interface RevenueTrend {
  date: string;
  revenue: string;
}

export interface TopProduct {
  id: number;
  name: string;
  totalSold: string;
}

export interface RecentOrder {
  id: number;
  userId: number;
  totalAmount: string;
  status: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  itemCount: number;
}
