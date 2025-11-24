// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

function makeSlug(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')      // пробелы → -
        .replace(/[^a-z0-9-]/g, '') // убираем всё лишнее
        .slice(0, 60);
}

export async function GET(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('ADMIN GET products error:', error);
        return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
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
        const body = await request.json();

        const {
            name,
            price,
            category,
            description,
            images,
            brand,
            compareAtPrice,
            stockQuantity,
            inStock,
            tags,
        } = body;

        if (!name || !price || !category) {
            return NextResponse.json(
                { error: 'Name, price und category sind erforderlich' },
                { status: 400 }
            );
        }

        const slug = makeSlug(name);

        const insertData: any = {
            name,
            slug,
            description: description ?? '',
            price: Number(price),
            category,
            brand: brand || null,
            compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
            in_stock: typeof inStock === 'boolean' ? inStock : true,
            stock_quantity: stockQuantity ? Number(stockQuantity) : 0,
            images: Array.isArray(images)
                ? images
                : images
                    ? [images]
                    : [],
            tags: Array.isArray(tags)
                ? tags
                : typeof tags === 'string'
                    ? tags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                    : [],
        };

        console.log('ADMIN CREATE PRODUCT insertData:', insertData);

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('ADMIN CREATE PRODUCT supabase error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            });
            return NextResponse.json(
                { error: 'Failed to create product', details: error },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (e: any) {
        console.error('ADMIN CREATE PRODUCT exception:', e);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
