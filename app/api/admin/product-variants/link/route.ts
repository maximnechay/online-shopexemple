// app/api/admin/product-variants/link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
        const { productIds, variantGroup } = await request.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 product IDs required' },
                { status: 400 }
            );
        }

        // Update all products with the same variant_group
        const { error } = await supabaseAdmin
            .from('products')
            .update({ variant_group: variantGroup })
            .in('id', productIds);

        if (error) {
            console.error('Error linking products:', error);
            return NextResponse.json(
                { error: 'Failed to link products' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, variantGroup });
    } catch (error) {
        console.error('Error in product variants link API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
