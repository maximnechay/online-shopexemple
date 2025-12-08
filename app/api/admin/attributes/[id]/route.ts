// app/api/admin/attributes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

// PATCH - Update attribute
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
        );
    }

    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

    try {
        const body = await request.json();
        const updates: any = {};

        if (body.name !== undefined) {
            updates.name = body.name;
            // Update slug if name changes
            updates.slug = body.name
                .toLowerCase()
                .replace(/ä/g, 'ae')
                .replace(/ö/g, 'oe')
                .replace(/ü/g, 'ue')
                .replace(/ß/g, 'ss')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
        if (body.type !== undefined) updates.type = body.type;
        if (body.filterable !== undefined) updates.filterable = body.filterable;
        if (body.visibleInCatalog !== undefined) updates.visible_in_catalog = body.visibleInCatalog;
        if (body.displayOrder !== undefined) updates.display_order = body.displayOrder;
        if (body.categories !== undefined) updates.categories = body.categories;

        const { data, error } = await supabaseAdmin
            .from('attributes')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating attribute:', error);
            return NextResponse.json({ error: 'Failed to update attribute' }, { status: 500 });
        }

        return NextResponse.json({
            id: data.id,
            name: data.name,
            slug: data.slug,
            type: data.type,
            displayOrder: data.display_order,
            filterable: data.filterable,
            visibleInCatalog: data.visible_in_catalog,
            categories: data.categories || [],
            updatedAt: data.updated_at,
        });
    } catch (error) {
        console.error('❌ PATCH attribute error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete attribute
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
        );
    }

    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

    try {
        console.log('🗑️ DELETE attribute request for ID:', params.id);

        const { error } = await supabaseAdmin
            .from('attributes')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('❌ Error deleting attribute:', error);
            return NextResponse.json({ error: 'Failed to delete attribute: ' + error.message }, { status: 500 });
        }

        console.log('✅ Attribute deleted successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE attribute error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
