import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { validateRequest, updateCategorySchema } from '@/lib/security/validation';
import { createAuditLog } from '@/lib/security/audit-log';
import { checkAdmin } from '@/lib/auth/admin-check';

export const dynamic = 'force-dynamic';

// PUT - обновить категорию
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

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
        const body = await request.json();
        const { id } = params;

        const validation = validateRequest(updateCategorySchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const { name, slug, description, image } = validation.data;

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

        await createAuditLog({
            action: 'category.update',
            resourceType: 'category',
            resourceId: id,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: { name, slug },
        });

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
    { params }: { params: { id: string } }
) {
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

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
        const { id } = params;

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

        await createAuditLog({
            action: 'category.delete',
            resourceType: 'category',
            resourceId: id,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete category', details: error },
            { status: 500 }
        );
    }
}
