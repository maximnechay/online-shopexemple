// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/admin/products/:id — получить один товар для формы редактирования
export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', params.id)
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
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();

        const allowed = [
            'name',
            'price',
            'category',
            'description',
            'images',
            'stock_quantity',
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
            .eq('id', params.id)
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

// DELETE /api/admin/products/:id — удаление
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
    const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', params.id);

    if (error) {
        console.error('DELETE product error:', error);
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
