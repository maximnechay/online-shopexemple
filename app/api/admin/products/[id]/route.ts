// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// GET /api/admin/products/:id — получить один товар для формы редактирования
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params;

        // 1. Продукт
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (productError || !product) {
            console.error('GET product error:', productError);
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // 2. Варианты
        const { data: variantsData, error: variantsError } = await supabaseAdmin
            .from('product_variants')
            .select('*')
            .eq('product_id', id)
            .order('created_at', { ascending: true });

        if (variantsError) {
            console.error('GET product variants error:', variantsError);
        }

        const variants = (variantsData || []).map(v => ({
            id: v.id,
            productId: v.product_id,
            sku: v.sku,
            name: v.name,
            price: Number(v.price),
            compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
            stockQuantity: v.stock_quantity,
            inStock: v.in_stock,
            images: v.images || [],
            isActive: v.is_active,
            createdAt: v.created_at,
            updatedAt: v.updated_at
        }));

        // 3. Атрибуты вариантов для этого продукта
        const { data: attrsRows, error: attrsError } = await supabaseAdmin
            .from('product_attributes')
            .select('variant_id, attribute_id, attribute_value_id, custom_value')
            .eq('product_id', id);

        if (attrsError) {
            console.error('GET product variant attributes error:', attrsError);
        }

        // Собираем в удобную структуру:
        // variantAttributes[variantId] = Array<{ attributeId, attributeValueId, customValue }>
        const variantAttributes: Record<
            string,
            Array<{
                attributeId: string;
                attributeValueId: string | null;
                customValue: string | null;
            }>
        > = {};

        (attrsRows || []).forEach(row => {
            if (!row.variant_id) return; // подстраховка
            if (!variantAttributes[row.variant_id]) {
                variantAttributes[row.variant_id] = [];
            }
            variantAttributes[row.variant_id].push({
                attributeId: row.attribute_id,
                attributeValueId: row.attribute_value_id,
                customValue: row.custom_value
            });
        });

        // 4. Отдаем все вместе
        return NextResponse.json({
            ...product,
            variants,
            variantAttributes
        });
    } catch (err) {
        console.error('GET product exception:', err);
        return NextResponse.json(
            { error: 'Failed to load product' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/products/:id — обновление
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params;
        const body = await request.json();

        const allowed = [
            'name',
            'price',
            'category',
            'description',
            'images',
            'in_stock',
            'compare_at_price',
            'brand',
            'tags',
            'slug',
            'homepage_position'
        ];

        const updateData: any = {};
        for (const key of allowed) {
            if (key in body) updateData[key] = body[key];
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('PATCH product error:', error);
            return NextResponse.json(
                { error: 'Failed to update product' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('PATCH product exception:', err);
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    return PATCH(request, ctx);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('DELETE product error:', error);
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
