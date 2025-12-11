import { Product } from '@/lib/types';
import { createClient } from './client';

/**
 * Transforms product data from Supabase format (snake_case) to application format (camelCase)
 */
export function transformProductFromDB(dbProduct: any): Product {
    return {
        id: dbProduct.id,
        name: dbProduct.name,
        slug: dbProduct.slug,
        description: dbProduct.description,
        price: dbProduct.price,
        maxPrice: dbProduct.max_price || undefined,
        compareAtPrice: dbProduct.compare_at_price,
        images: dbProduct.images,
        category: dbProduct.category,
        brand: dbProduct.brand,
        inStock: dbProduct.in_stock,
        stockQuantity: dbProduct.stock_quantity,
        tags: dbProduct.tags || [],
        rating: dbProduct.rating,
        reviewCount: dbProduct.review_count,
        attributes: dbProduct.attributes,
        createdAt: dbProduct.created_at,
        updatedAt: dbProduct.updated_at,
    };
}

/**
 * Transforms multiple products from Supabase format to application format
 */
export function transformProductsFromDB(dbProducts: any[]): Product[] {
    return dbProducts.map(transformProductFromDB);
}

/**
 * Fetches products for homepage (positions 1-4)
 */
export async function fetchHomepageProducts(): Promise<Product[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('homepage_position', 'is', null)
        .order('homepage_position', { ascending: true })
        .limit(4);

    if (error) {
        console.error('❌ Error loading homepage products:', error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return transformProductsFromDB(data);
}   