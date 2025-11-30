// app/api/coupons/validate/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// POST /api/coupons/validate - Проверить купон
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { code, orderAmount } = await request.json();

        if (!code) {
            return NextResponse.json(
                { error: 'Coupon code is required' },
                { status: 400 }
            );
        }

        // Получаем текущего пользователя (если авторизован)
        const {
            data: { user },
        } = await supabase.auth.getUser();

        console.log('🔍 Validating coupon:', {
            code: code.toUpperCase(),
            userId: user?.id || 'guest',
            orderAmount,
        });

        // Вызываем функцию валидации
        const { data, error } = await supabase.rpc('validate_coupon', {
            p_code: code.toUpperCase(),
            p_user_id: user?.id || null,
            p_order_amount: orderAmount || 0,
        });

        console.log('📊 Validation result:', { data, error });

        if (error) {
            console.error('❌ Error validating coupon:', error);
            return NextResponse.json(
                { error: 'Failed to validate coupon', details: error.message },
                { status: 500 }
            );
        }

        const result = data?.[0];

        if (!result) {
            return NextResponse.json(
                { error: 'Invalid response from validation function' },
                { status: 500 }
            );
        }

        if (!result.is_valid) {
            return NextResponse.json(
                {
                    valid: false,
                    error: result.error_message,
                },
                { status: 200 }
            );
        }

        return NextResponse.json({
            valid: true,
            couponId: result.coupon_id,
            discountAmount: parseFloat(result.discount_amount),
            couponType: result.coupon_type,
        });
    } catch (error) {
        console.error('Coupon validation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
