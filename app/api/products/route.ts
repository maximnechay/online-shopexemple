// app/api/products/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { transformProductsFromDB } from '@/lib/supabase/helpers';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    // Rate limiting

    const rateLimitResult = rateLimit(request, RATE_LIMITS.products);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const attributeFilters = searchParams.get('attributes'); // JSON string: {"farbe": ["id1", "id2"], "grosse": ["id3"]}
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const inStockOnly = searchParams.get('inStock') === 'true';

        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (minPrice) {
            query = query.gte('price', parseFloat(minPrice));
        }

        if (maxPrice) {
            query = query.lte('price', parseFloat(maxPrice));
        }

        if (inStockOnly) {
            query = query.eq('in_stock', true);
        }

        const { data: products, error } = await query;

        if (error) {
            console.error('Products fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        // Apply attribute filters if provided
        let filteredProducts = products || [];

        if (attributeFilters) {
            try {
                const filters = JSON.parse(attributeFilters);
                const filterKeys = Object.keys(filters);

                if (filterKeys.length > 0) {
                    // Get product IDs that match ALL attribute filters
                    const productIds = filteredProducts.map(p => p.id);

                    for (const attributeSlug of filterKeys) {
                        const valueIds = filters[attributeSlug];
                        if (!valueIds || valueIds.length === 0) continue;

                        // Get products that have at least one of these attribute values
                        const { data: matchingProductAttributes } = await supabase
                            .from('product_attributes')
                            .select('product_id, attribute_id, attribute_value_id')
                            .in('product_id', productIds)
                            .in('attribute_value_id', valueIds);

                        const matchingProductIds = new Set(
                            matchingProductAttributes?.map(pa => pa.product_id) || []
                        );

                        // Filter products to only those matching this attribute
                        filteredProducts = filteredProducts.filter(p =>
                            matchingProductIds.has(p.id)
                        );
                    }
                }
            } catch (e) {
                console.error('Error parsing attribute filters:', e);
            }
        }

        const transformedProducts = transformProductsFromDB(filteredProducts);

        return NextResponse.json(transformedProducts, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error: any) {
        console.error('Products API error:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        );
    }

}
