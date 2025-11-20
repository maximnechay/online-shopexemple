import { Product } from '@/lib/types';

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
