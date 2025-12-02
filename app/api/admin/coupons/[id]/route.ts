// app/api/admin/coupons/[id]/route.ts
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// GET /api/admin/coupons/[id] - Получить купон
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
        const supabase = createServerSupabaseAdminClient();
        const { id } = await params;

        const { data: coupon, error } = await supabase
            .from('coupons')
            .select(`
        *,
        usages:coupon_usages(
          id,
          order_id,
          user_id,
          discount_amount,
          created_at
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching coupon:', error);
            return NextResponse.json(
                { error: 'Failed to fetch coupon' },
                { status: 500 }
            );
        }

        if (!coupon) {
            return NextResponse.json(
                { error: 'Coupon not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(coupon);
    } catch (error) {
        console.error('Get coupon error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/coupons/[id] - Обновить купон
export async function PATCH(
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
        const supabase = createServerSupabaseAdminClient();
        const { id } = await params;
        const body = await request.json();

        const updateData: any = {};

        if (body.description !== undefined) updateData.description = body.description;
        if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
        if (body.minOrderAmount !== undefined) updateData.min_order_amount = parseFloat(body.minOrderAmount);
        if (body.maxDiscountAmount !== undefined) updateData.max_discount_amount = body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null;
        if (body.maxUses !== undefined) updateData.max_uses = body.maxUses || null;
        if (body.perUserLimit !== undefined) updateData.per_user_limit = body.perUserLimit || null;
        if (body.validFrom !== undefined) updateData.valid_from = body.validFrom;
        if (body.validUntil !== undefined) updateData.valid_until = body.validUntil || null;
        if (body.isActive !== undefined) updateData.is_active = body.isActive;

        const { data: coupon, error } = await supabase
            .from('coupons')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating coupon:', error);
            return NextResponse.json(
                { error: 'Failed to update coupon' },
                { status: 500 }
            );
        }

        return NextResponse.json(coupon);
    } catch (error) {
        console.error('Update coupon error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/coupons/[id] - Удалить купон
export async function DELETE(
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
        const supabase = createServerSupabaseAdminClient();
        const { id } = await params;

        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting coupon:', error);
            return NextResponse.json(
                { error: 'Failed to delete coupon' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete coupon error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
