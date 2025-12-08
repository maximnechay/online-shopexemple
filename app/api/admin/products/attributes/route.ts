// app/api/admin/products/attributes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

// POST - Assign attribute to product
export async function POST(request: NextRequest) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }

    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

    try {
        const body = await request.json();
        const { productId, attributeId, attributeValueId, customValue } = body;

        if (!productId || !attributeId) {
            return NextResponse.json(
                { error: 'productId and attributeId are required' },
                { status: 400 }
            );
        }

        if (!attributeValueId && !customValue) {
            return NextResponse.json(
                { error: 'attributeValueId or customValue is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('product_attributes')
            .insert({
                product_id: productId,
                attribute_id: attributeId,
                attribute_value_id: attributeValueId || null,
                custom_value: customValue || null,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating product attribute:', error);
            return NextResponse.json(
                { error: 'Failed to create product attribute' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            id: data.id,
            productId: data.product_id,
            attributeId: data.attribute_id,
            attributeValueId: data.attribute_value_id,
            customValue: data.custom_value,
            createdAt: data.created_at,
        });
    } catch (error) {
        console.error('❌ POST product attribute error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}