// app/api/admin/attributes/values/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

// PATCH - Update attribute value
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
        console.log('📝 PATCH attribute value request:', { id: params.id, body });

        const updates: any = {};

        if (body.value !== undefined) {
            updates.value = body.value;
            // Update slug if value changes
            updates.slug = body.value
                .toLowerCase()
                .replace(/ä/g, 'ae')
                .replace(/ö/g, 'oe')
                .replace(/ü/g, 'ue')
                .replace(/ß/g, 'ss')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
        if (body.displayOrder !== undefined) updates.display_order = body.displayOrder;
        if (body.categories !== undefined) updates.categories = body.categories;

        console.log('📝 Updates to apply:', updates);

        const { data, error } = await supabaseAdmin
            .from('attribute_values')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating attribute value:', error);
            return NextResponse.json({ error: 'Failed to update attribute value' }, { status: 500 });
        }

        console.log('✅ Updated attribute value:', data);

        return NextResponse.json({
            id: data.id,
            attributeId: data.attribute_id,
            value: data.value,
            slug: data.slug,
            displayOrder: data.display_order,
            categories: data.categories || [],
            updatedAt: data.updated_at,
        });
    } catch (error) {
        console.error('❌ PATCH attribute value error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete attribute value
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
        console.log('🗑️ DELETE attribute value request for ID:', params.id);

        const { error } = await supabaseAdmin
            .from('attribute_values')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('❌ Error deleting attribute value:', error);
            return NextResponse.json({ error: 'Failed to delete attribute value: ' + error.message }, { status: 500 });
        }

        console.log('✅ Attribute value deleted successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE attribute value error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
