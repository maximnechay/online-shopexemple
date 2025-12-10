// lib/types.ts
// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  maxPrice?: number;
  compareAtPrice?: number; // Цена до скидки
  images: string[];
  category: ProductCategory;
  brand?: string;
  inStock: boolean;
  stockQuantity: number;
  tags: string[];
  rating?: number;
  reviewCount?: number;
  attributes?: ProductAttribute[];
  featured?: boolean; // Флаг "рекомендуемый товар"
  size?: string; // ✅ ДОБАВЛЕНО: Размер товара (например "50ml", "100g")
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export type ProductCategory =
  | 'hair-care'
  | 'face-care'
  | 'body-care'
  | 'makeup'
  | 'tools'
  | 'nails'
  | 'accessories';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  createdAt: string;
}

// Database Order Type (from Supabase)
export interface DatabaseOrder {
  id: string;
  order_number: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  house_number: string;
  city: string;
  postal_code: string;
  subtotal: string | number;
  shipping: string | number;
  total: string | number;
  delivery_method: 'delivery' | 'pickup';
  payment_method: 'card' | 'cash' | 'paypal';
  payment_status: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes: string | null;
  paypal_order_id: string | null;
  paypal_transaction_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  created_at: string;
  updated_at: string;
  items?: DatabaseOrderItem[];
}

export interface DatabaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total: number;
  created_at: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod =
  | 'card'
  | 'cash'
  | 'online';

export type DeliveryMethod =
  | 'pickup'
  | 'delivery'
  | 'courier';

// Filter Types
export interface ProductFilters {
  category?: ProductCategory;
  priceRange?: [number, number];
  brands?: string[];
  inStockOnly?: boolean;
  sortBy?: SortOption;
  searchQuery?: string;
}

export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'newest'
  | 'popular';

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'fixed' | 'percentage' | 'free_shipping';
  amount: number;
  min_order_amount: number;
  max_discount_amount?: number;
  max_uses?: number;
  uses_count: number;
  per_user_limit?: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id?: string;
  discount_amount: number;
  created_at: string;
}

export interface CouponValidation {
  is_valid: boolean;
  error_message?: string;
  coupon_id?: string;
  discount_amount: number;
  coupon_type?: 'fixed' | 'percentage' | 'free_shipping';
}