// app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
    _req: NextRequest,
    { params }: { params: { orderId: string } }
) {
    const { orderId } = params;

    // сам заказ
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        console.error('Load order error:', orderError);
        return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
        );
    }

    // позиции заказа из order_items
    const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

    if (itemsError) {
        console.error('Load order items error:', itemsError);
    }

    return NextResponse.json({
        ...order,
        items: items ?? [],
    });
}
