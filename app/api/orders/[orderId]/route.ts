// app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const { orderId } = await params;

    console.log('🔍 Fetching order:', orderId);

    // Получаем сам заказ
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        console.error('❌ Load order error:', orderError);
        return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
        );
    }

    console.log('📦 Raw order from DB:', order);

    // Получаем позиции заказа из order_items
    const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

    if (itemsError) {
        console.error('❌ Load order items error:', itemsError);
    }

    console.log('📦 Raw items from DB:', items);

    // Трансформируем items из snake_case в camelCase
    const transformedItems = (items ?? []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        productPrice: Number(item.product_price),
        quantity: item.quantity,
    }));

    console.log('✅ Transformed items:', transformedItems);

    return NextResponse.json({
        ...order,
        items: transformedItems,
    }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}
