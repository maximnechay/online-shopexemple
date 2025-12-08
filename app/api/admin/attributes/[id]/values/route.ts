// app/api/admin/attributes/[id]/values/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

// POST - Add value to attribute
export async function POST(
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
        const { value, displayOrder = 0, categories = [] } = body;

        if (!value) {
            return NextResponse.json({ error: 'Value is required' }, { status: 400 });
        }

        // Generate slug
        const slug = value
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const { data, error } = await supabaseAdmin
            .from('attribute_values')
            .insert({
                attribute_id: params.id,
                value,
                slug,
                display_order: displayOrder,
                categories,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating attribute value:', error);
            return NextResponse.json({ error: 'Failed to create attribute value' }, { status: 500 });
        }

        return NextResponse.json({
            id: data.id,
            attributeId: data.attribute_id,
            value: data.value,
            slug: data.slug,
            displayOrder: data.display_order,
            categories: data.categories || [],
            createdAt: data.created_at,
        });
    } catch (error) {
        console.error('❌ POST attribute value error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
