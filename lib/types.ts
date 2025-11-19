// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
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
