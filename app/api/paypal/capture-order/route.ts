// app/api/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/helpers';

// ✅ Используем отдельную переменную для PayPal mode
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API = PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
}

export async function POST(request: NextRequest) {
    try {
        const { orderID } = await request.json();

        if (!orderID) {
            return NextResponse.json(
                { error: 'PayPal Order ID is required' },
                { status: 400 }
            );
        }

        console.log('💰 Capturing PayPal payment:', orderID, 'Mode:', PAYPAL_MODE);

        const accessToken = await getPayPalAccessToken();

        // Capture the PayPal order
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const captureData = await response.json();

        if (!response.ok) {
            console.error('❌ PayPal capture error:', captureData);
            return NextResponse.json(
                { error: 'Failed to capture PayPal payment', details: captureData },
                { status: response.status }
            );
        }

        console.log('✅ PayPal payment captured:', captureData.id);

        // Получаем ID нашего заказа из custom_id
        const supabaseOrderId = captureData.purchase_units[0].payments.captures[0].custom_id ||
            captureData.purchase_units[0].custom_id;

        if (!supabaseOrderId) {
            console.error('❌ No order ID found in PayPal capture');
            return NextResponse.json(
                { error: 'Order ID not found' },
                { status: 400 }
            );
        }

        console.log('🔍 Updating order:', supabaseOrderId);

        // Обновляем существующий заказ статусом оплаты
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'completed',
                status: 'processing',
                paypal_transaction_id: captureData.id,
            })
            .eq('id', supabaseOrderId)
            .select('*')
            .single();

        if (orderError || !order) {
            console.error('❌ Error updating order:', orderError);
            return NextResponse.json(
                { error: 'Failed to update order' },
                { status: 500 }
            );
        }

        console.log('✅ Order updated after PayPal payment:', order.id);

        // Отправляем email подтверждения
        try {
            await sendOrderEmails(order.id);
            console.log('📧 Order emails sent successfully');
        } catch (emailError) {
            console.error('❌ Error sending order emails:', emailError);
        }

        return NextResponse.json({
            id: captureData.id,
            status: captureData.status,
            supabaseOrderId: order.id,
        });
    } catch (error: any) {
        console.error('❌ Error capturing PayPal payment:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}