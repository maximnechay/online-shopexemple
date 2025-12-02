// app/api/products/[slug]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const { data: product, error } = await supabaseAdmin
            .from('products')
            .select(
                `
                id,
                name,
                slug,
                description,
                price,
                compare_at_price,
                images,
                category,
                brand,
                in_stock,
                stock_quantity,
                tags,
                rating,
                review_count,
                created_at,
                updated_at
            `
            )
            .eq('slug', slug)
            .single();

        if (error || !product) {
            console.error('PRODUCT NOT FOUND', { slug, error });
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        console.log('API PRODUCT', {
            slug,
            price: product.price,
            compare_at_price: product.compare_at_price,
            updated_at: product.updated_at,
        });

        const result = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: Number(product.price),
            compareAtPrice: product.compare_at_price
                ? Number(product.compare_at_price)
                : null,
            images: product.images ?? [],
            category: product.category,
            brand: product.brand,
            inStock: product.in_stock,
            stockQuantity: product.stock_quantity ?? 0,
            tags: product.tags ?? [],
            rating: product.rating ? Number(product.rating) : null,
            reviewCount: product.review_count ?? 0,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
        };

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (e) {
        console.error('Error fetching product:', e);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}
