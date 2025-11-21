// app/api/orders/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
    _req: NextRequest,
    { params }: { params: { userId: string } }
) {
    const { userId } = params;

    const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Load orders error:', error);
        return NextResponse.json(
            { error: 'Failed to load orders' },
            { status: 500 }
        );
    }

    const ordersWithItems = await Promise.all(
        (orders ?? []).map(async (order: any) => {
            const { data: items, error: itemsError } = await supabaseAdmin
                .from('order_items')
                .select('*')
                .eq('order_id', order.id);

            if (itemsError) {
                console.error(
                    `Load items error for order ${order.id}:`,
                    itemsError
                );
            }

            return {
                ...order,
                // numeric может прийти строкой, во фронте ты уже делаешь Number(...)
                items: items ?? [],
            };
        })
    );
    console.log(
        'SUPABASE URL:',
        process.env.NEXT_PUBLIC_SUPABASE_URL
    );

    console.log('ORDERS FROM DB:', orders?.length, orders);
    return NextResponse.json(ordersWithItems);
}
