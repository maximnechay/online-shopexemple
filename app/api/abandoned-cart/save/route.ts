// app/api/abandoned-cart/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'edge';

interface CartItem {
    product_id: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    image?: string;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerSupabaseAdminClient();

        const { email, cartItems, cartTotal, utmParams } = await request.json();

        // Валидация
        if (!email || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return NextResponse.json(
                { error: 'Email and cart items are required' },
                { status: 400 }
            );
        }

        if (!cartTotal || cartTotal <= 0) {
            return NextResponse.json(
                { error: 'Cart total must be greater than 0' },
                { status: 400 }
            );
        }

        // Получить текущего пользователя (если авторизован)
        const supabaseAuth = createServerSupabaseAdminClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        // Генерировать токен восстановления
        const { data: tokenData, error: tokenError } = await supabase
            .rpc('generate_recovery_token');

        if (tokenError) {
            console.error('Error generating token:', tokenError);
            return NextResponse.json(
                { error: 'Failed to generate recovery token' },
                { status: 500 }
            );
        }

        const recovery_token = tokenData;

        // Получить IP и User Agent
        const ip_address = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const user_agent = request.headers.get('user-agent') || 'unknown';

        // Проверить, есть ли уже брошенная корзина для этого email
        const { data: existingCarts } = await supabase
            .from('abandoned_carts')
            .select('id')
            .eq('email', email)
            .is('recovered_at', null)
            .order('created_at', { ascending: false })
            .limit(1);

        if (existingCarts && existingCarts.length > 0) {
            const existingCart = existingCarts[0];
            // Обновить существующую корзину
            const { data, error } = await supabase
                .from('abandoned_carts')
                .update({
                    cart_items: cartItems,
                    cart_total: cartTotal,
                    utm_source: utmParams?.source,
                    utm_medium: utmParams?.medium,
                    utm_campaign: utmParams?.campaign,
                    ip_address,
                    user_agent,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingCart.id)
                .select();

            if (error) {
                console.error('Error updating abandoned cart:', error);
                return NextResponse.json(
                    { error: 'Failed to update abandoned cart' },
                    { status: 500 }
                );
            }

            const updatedCart = data?.[0];

            return NextResponse.json({
                success: true,
                cart_id: updatedCart?.id || existingCart.id,
                recovery_token: updatedCart?.recovery_token,
                message: 'Cart updated successfully',
            });
        }

        // Создать новую брошенную корзину
        const { data, error } = await supabase
            .from('abandoned_carts')
            .insert({
                user_id: user?.id || null,
                email,
                cart_items: cartItems,
                cart_total: cartTotal,
                recovery_token,
                utm_source: utmParams?.source,
                utm_medium: utmParams?.medium,
                utm_campaign: utmParams?.campaign,
                ip_address,
                user_agent,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving abandoned cart:', error);
            return NextResponse.json(
                { error: 'Failed to save abandoned cart' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            cart_id: data.id,
            recovery_token: data.recovery_token,
            message: 'Cart saved successfully',
        });

    } catch (error) {
        console.error('Error in abandoned cart save:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
