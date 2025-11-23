// app/api/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const PAYPAL_API = process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
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
        const { orderID, supabaseOrderId } = await request.json();

        if (!orderID) {
            return NextResponse.json(
                { error: 'PayPal Order ID is required' },
                { status: 400 }
            );
        }

        if (!supabaseOrderId) {
            return NextResponse.json(
                { error: 'Supabase Order ID is required' },
                { status: 400 }
            );
        }

        console.log('💰 Capturing PayPal payment:', orderID, 'for order:', supabaseOrderId);

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

            // Обновляем заказ как failed
            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'failed',
                    status: 'cancelled',
                })
                .eq('id', supabaseOrderId);

            return NextResponse.json(
                { error: 'Failed to capture PayPal payment', details: captureData },
                { status: response.status }
            );
        }

        console.log('✅ PayPal payment captured:', captureData.id);

        // Update Supabase order with PayPal transaction ID and status
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'completed',
                paypal_transaction_id: captureData.id,
                payment_method: 'paypal',
                status: 'processing', // Заказ оплачен, переводим в обработку
            })
            .eq('id', supabaseOrderId);

        if (updateError) {
            console.error('❌ Error updating order with PayPal details:', updateError);
            // Не возвращаем ошибку клиенту, т.к. платёж прошёл
            // Просто логируем для ручной проверки
        }

        return NextResponse.json({
            id: captureData.id,
            status: captureData.status,
            supabaseOrderId,
        });
    } catch (error: any) {
        console.error('❌ Error capturing PayPal payment:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}