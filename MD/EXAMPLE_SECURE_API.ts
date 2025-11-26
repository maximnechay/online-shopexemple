// app/api/admin/products/route.ts (EXAMPLE с security features)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { validateRequest, createProductSchema } from '@/lib/security/validation';
import { createAuditLog } from '@/lib/security/audit-log';
import { checkIdempotency, saveIdempotency } from '@/lib/security/payment-deduplication';

// GET - получить все продукты
export async function GET(request: NextRequest) {
    // 1. Rate limiting
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
        const supabase = createServerSupabaseAdminClient();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch products' },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

// POST - создать новый продукт
export async function POST(request: NextRequest) {
    // 1. Rate limiting
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

    // 2. Check idempotency (опционально, для критичных операций)
    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey) {
        const idempotencyCheck = await checkIdempotency(idempotencyKey);
        if (idempotencyCheck.exists) {
            return NextResponse.json(idempotencyCheck.response);
        }
    }

    try {
        const body = await request.json();

        // 3. Input validation
        const validation = validateRequest(createProductSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const productData = validation.data;
        const supabase = createServerSupabaseAdminClient();

        // Создаём продукт
        const { data: product, error } = await supabase
            .from('products')
            .insert([{
                name: productData.name,
                price: productData.price,
                compare_at_price: productData.compareAtPrice,
                category: productData.category,
                description: productData.description,
                brand: productData.brand,
                stock_quantity: productData.stockQuantity,
                in_stock: productData.inStock,
                images: productData.images,
                tags: productData.tags,
            }])
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to create product' },
                { status: 500 }
            );
        }

        // 4. Audit logging
        await createAuditLog({
            action: 'product.create',
            resourceType: 'product',
            resourceId: product.id,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
                productName: product.name,
                category: product.category,
            },
        });

        // 5. Save idempotency result
        if (idempotencyKey) {
            await saveIdempotency(idempotencyKey, product, 86400); // 24 hours
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create product' },
            { status: 500 }
        );
    }
}
