// app/api/orders/[orderId]/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderEmails } from '@/lib/email/helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Отправить email для заказа (если еще не отправлены)
 * POST /api/orders/[orderId]/send-email
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;

        console.log('📧 Email send request for order:', orderId);

        // Проверяем статус заказа
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('payment_status, status, email')
            .eq('id', orderId)
            .single();

        if (orderError) {
            console.error('❌ Order fetch error:', orderError);
            return NextResponse.json(
                { error: 'Order not found', details: orderError.message },
                { status: 404 }
            );
        }

        if (!order) {
            console.error('❌ Order not found:', orderId);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Отправляем email если оплата завершена и статус не cancelled
        if (order.payment_status === 'completed' && order.status !== 'cancelled') {
            console.log('✅ Order is paid, sending emails...');

            const result = await sendOrderEmails(orderId);

            return NextResponse.json({
                success: true,
                message: 'Emails sent successfully',
                result,
            });
        } else {
            console.log('⏳ Cannot send emails:', {
                payment_status: order.payment_status,
                status: order.status,
                reason: order.payment_status !== 'completed'
                    ? 'Payment not completed'
                    : 'Order is cancelled'
            });

            return NextResponse.json({
                success: false,
                message: order.payment_status !== 'completed'
                    ? 'Order payment not completed'
                    : 'Order is cancelled',
                payment_status: order.payment_status,
                status: order.status,
            });
        }
    } catch (error: any) {
        console.error('❌ Error in send-email endpoint:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
