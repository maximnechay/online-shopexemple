// app/api/orders/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * 🔒 БЕЗОПАСНЫЙ endpoint для получения заказов пользователя
 * Проверяет, что текущий пользователь имеет право просматривать эти заказы
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        // 🔒 КРИТИЧНО: Получаем текущую сессию пользователя
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized - please log in' },
                { status: 401 }
            );
        }

        // 🔒 КРИТИЧНО: Проверяем, что пользователь запрашивает СВОИ заказы
        if (user.id !== userId) {
            console.warn('🚨 Security: User', user.id, 'attempted to access orders of', userId);
            return NextResponse.json(
                { error: 'Forbidden - you can only access your own orders' },
                { status: 403 }
            );
        }

        console.log('📦 Fetching orders for user:', userId);

        // Теперь безопасно получаем заказы
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    product_id,
                    product_name,
                    product_price,
                    quantity
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('❌ Error fetching orders:', ordersError);
            return NextResponse.json(
                { error: 'Failed to fetch orders' },
                { status: 500 }
            );
        }

        // Трансформируем данные из snake_case в camelCase
        const transformedOrders = orders?.map((order: any) => ({
            ...order,
            items: order.order_items?.map((item: any) => ({
                productId: item.product_id,
                productName: item.product_name,
                productPrice: Number(item.product_price),
                quantity: item.quantity,
            })) || [],
        })) || [];

        console.log('✅ Found', transformedOrders.length, 'orders');

        return NextResponse.json(transformedOrders, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
            },
        });
    } catch (error: any) {
        console.error('❌ Error in GET /api/orders/user/[userId]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}