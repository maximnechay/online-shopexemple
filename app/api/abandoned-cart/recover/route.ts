// app/api/abandoned-cart/recover/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Recovery token is required' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseAdminClient();

        // Найти корзину по токену
        const { data: cart, error } = await supabase
            .from('abandoned_carts')
            .select('*')
            .eq('recovery_token', token)
            .single();

        if (error || !cart) {
            return NextResponse.json(
                { error: 'Invalid or expired recovery token' },
                { status: 404 }
            );
        }

        // Проверить, не восстановлена ли уже корзина
        if (cart.recovered_at) {
            return NextResponse.json(
                { error: 'Cart has already been recovered' },
                { status: 400 }
            );
        }

        // Вернуть данные корзины
        return NextResponse.json({
            success: true,
            cart: {
                id: cart.id,
                email: cart.email,
                items: cart.cart_items,
                total: cart.cart_total,
                coupon_code: cart.coupon_code,
                created_at: cart.created_at,
            },
        });

    } catch (error) {
        console.error('Error recovering cart:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Recovery token is required' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseAdminClient();

        // Пометить корзину как восстановленную
        const { data, error } = await supabase
            .rpc('mark_cart_as_recovered', { token });

        if (error) {
            console.error('Error marking cart as recovered:', error);
            return NextResponse.json(
                { error: 'Failed to mark cart as recovered' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Invalid or already recovered token' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Cart marked as recovered',
        });

    } catch (error) {
        console.error('Error in cart recovery:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
