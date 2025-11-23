// lib/supabase/types.ts
export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compare_at_price?: number;
    images: string[];
    category: string;
    brand?: string;
    in_stock: boolean;
    stock_quantity: number;
    tags: string[];
    rating?: number;
    review_count?: number;
    featured?: boolean; // Флаг "рекомендуемый товар"
    size?: string; // ✅ ДОБАВЛЕНО: Размер товара
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    user_id?: string;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    subtotal: number;
    shipping: number;
    total: number;
    delivery_method: string;
    payment_method: string;
    payment_status: string;
    status: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    product_name: string;
    product_price: number;
    quantity: number;
    total: number;
    created_at: string;
}