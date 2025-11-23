// app/api/admin/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/helpers';

/**
 * GET /api/admin/orders/[orderId]
 * Получить детальную информацию о заказе
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    product_id,
                    product_name,
                    product_price,
                    quantity,
                    created_at
                )
            `)
            .eq('id', orderId)
            .single();

        if (error || !order) {
            console.error('❌ Error fetching order:', error);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('❌ Admin order detail API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/orders/[orderId]
 * Обновить заказ (статус, notes, etc)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;
        const body = await request.json();

        console.log('📝 Updating order:', orderId, body);

        const { status, payment_status, notes } = body;

        // Обновляем заказ
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .update({
                status,
                payment_status,
                notes,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .select(`
                *,
                order_items (
                    id,
                    product_id,
                    product_name,
                    product_price,
                    quantity,
                    created_at
                )
            `)
            .single();

        if (error) {
            console.error('❌ Error updating order:', error);
            return NextResponse.json(
                { error: 'Failed to update order' },
                { status: 500 }
            );
        }

        console.log('✅ Order updated successfully');

        // Если статус изменился на processing и оплата completed - отправляем email
        if (status === 'processing' && payment_status === 'completed') {
            console.log('📧 Order is now processing and paid, sending emails...');
            try {
                await sendOrderEmails(orderId);
                console.log('✅ Emails sent successfully');
            } catch (emailError) {
                console.error('❌ Error sending emails (non-critical):', emailError);
                // Не прерываем, email не критичен
            }
        }

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('❌ Admin order update API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/orders/[orderId]
 * Удалить заказ (опционально)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;

        const { error } = await supabaseAdmin
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) {
            console.error('❌ Error deleting order:', error);
            return NextResponse.json(
                { error: 'Failed to delete order' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('❌ Admin order delete API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
