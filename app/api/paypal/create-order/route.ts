// app/api/paypal/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ✅ Используем отдельную переменную для PayPal mode
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API = PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    console.log('🔍 PayPal Configuration:', {
        mode: PAYPAL_MODE,
        api: PAYPAL_API,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdPreview: clientId?.substring(0, 15) + '...'
    });

    if (!clientId || !clientSecret) {
        console.error('❌ PayPal credentials missing:', {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret
        });
        throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('🔑 Requesting PayPal access token from:', `${PAYPAL_API}/v1/oauth2/token`);

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PayPal token request failed:', {
            mode: PAYPAL_MODE,
            status: response.status,
            statusText: response.statusText,
            error: errorText
        });
        throw new Error(`Failed to get PayPal access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ PayPal access token obtained successfully');
    return data.access_token;
}

export async function POST(request: NextRequest) {
    try {
        const { supabaseOrderId } = await request.json();

        if (!supabaseOrderId) {
            return NextResponse.json(
                { error: 'Supabase Order ID is required' },
                { status: 400 }
            );
        }

        console.log('🔍 Creating PayPal order for Supabase order:', supabaseOrderId);

        // 🔒 БЕЗОПАСНОСТЬ: Получаем сумму из БД, а не от клиента
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('total_amount, status, payment_status')
            .eq('id', supabaseOrderId)
            .single();

        if (orderError || !order) {
            console.error('❌ Order not found:', orderError);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Проверяем, что заказ ещё не оплачен
        if (order.payment_status === 'completed') {
            return NextResponse.json(
                { error: 'Order already paid' },
                { status: 400 }
            );
        }

        const amount = Number(order.total_amount);

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid order amount' },
                { status: 400 }
            );
        }

        console.log('💰 Order amount from DB:', amount);

        const accessToken = await getPayPalAccessToken();

        // Создаём PayPal заказ
        console.log('📦 Creating PayPal order...');
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'EUR',
                            value: amount.toFixed(2),
                        },
                        // Сохраняем ID заказа из Supabase для webhook
                        custom_id: supabaseOrderId,
                        invoice_id: supabaseOrderId,
                    },
                ],
                application_context: {
                    brand_name: 'Beauty Salon',
                    locale: 'de-DE',
                    landing_page: 'NO_PREFERENCE',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'PAY_NOW',
                },
            }),
        });

        const paypalOrder = await response.json();

        if (!response.ok) {
            console.error('❌ PayPal order creation error:', {
                status: response.status,
                statusText: response.statusText,
                details: paypalOrder
            });
            return NextResponse.json(
                { error: 'Failed to create PayPal order', details: paypalOrder },
                { status: response.status }
            );
        }

        console.log('✅ PayPal order created:', paypalOrder.id);

        // Обновляем статус в Supabase
        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'pending',
            })
            .eq('id', supabaseOrderId);

        return NextResponse.json({
            id: paypalOrder.id,
            supabaseOrderId
        });
    } catch (error: any) {
        console.error('❌ Error creating PayPal order:', {
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}