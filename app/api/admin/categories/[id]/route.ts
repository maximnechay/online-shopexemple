import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

// PUT - обновить категорию
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerSupabaseAdminClient();
        const body = await request.json();
        const { name, slug, description, image } = body;
        const { id } = await params;

        const { data, error } = await supabase
            .from('categories')
            .update({
                name,
                slug: slug || id,
                description: description || null,
                image: image || null,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating category:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to update category', details: error },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating category:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update category', details: error },
            { status: 500 }
        );
    }
}

// DELETE - удалить категорию
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerSupabaseAdminClient();
        const { id } = await params;

        // Проверяем, есть ли товары в этой категории
        const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('category', id)
            .limit(1);

        if (products && products.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with products. Please reassign or delete products first.' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error deleting category:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to delete category', details: error },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete category', details: error },
            { status: 500 }
        );
    }
}
