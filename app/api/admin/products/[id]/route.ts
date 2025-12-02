// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// ВАЖНО: stock_quantity НЕ редактируется через этот endpoint
// Используйте POST /api/admin/products/[id]/adjust-stock для изменения запасов
// Это обеспечивает логирование всех изменений в stock_logs

// GET /api/admin/products/:id — получить один товар для формы редактирования
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params;
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('GET product error:', error);
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('GET product exception:', err);
        return NextResponse.json(
            { error: 'Failed to load product' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/products/:id — обновление
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
            'tags'
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

// PUT /api/admin/products/:id — полное обновление (алиас для PATCH)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return PATCH(request, { params });
}

// DELETE /api/admin/products/:id — удаление
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
