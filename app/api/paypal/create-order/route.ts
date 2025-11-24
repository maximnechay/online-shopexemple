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
        const { items, customer, deliveryMethod, address, userId } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Keine Artikel im Warenkorb' },
                { status: 400 }
            );
        }

        console.log('🔍 Creating PayPal order with items:', items);

        // Считаем сумму
        const amount = items.reduce(
            (sum: number, item: any) => sum + item.productPrice * item.quantity,
            0
        );

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid order amount' },
                { status: 400 }
            );
        }

        console.log('💰 Order amount:', amount);

        // Готовим адрес для метаданных
        let delivery_address: string;
        let delivery_city: string;
        let delivery_postal_code: string;

        if (deliveryMethod === 'delivery') {
            delivery_address = `${address?.street ?? ''} ${address?.houseNumber ?? ''}`.trim();
            delivery_city = address?.city ?? '';
            delivery_postal_code = address?.postalCode ?? '';
        } else {
            delivery_address = 'Abholung im Salon';
            delivery_city = 'Hannover';
            delivery_postal_code = '0';
        }

        const accessToken = await getPayPalAccessToken();

        // Создаём временный заказ в БД для хранения данных
        // PayPal custom_id имеет лимит 127 символов, поэтому используем DB
        const { data: tempOrder, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId || null,
                customer_name: customer.name,
                customer_email: customer.email,
                customer_phone: customer.phone,
                delivery_method: deliveryMethod,
                payment_method: 'paypal',
                delivery_address: delivery_address,
                delivery_city: delivery_city,
                delivery_postal_code: delivery_postal_code,
                total_amount: amount,
                status: 'pending',
                payment_status: 'pending',
            })
            .select()
            .single();

        if (orderError || !tempOrder) {
            console.error('❌ Failed to create temporary order:', orderError);
            throw new Error('Failed to create order');
        }

        console.log('✅ Temporary order created:', tempOrder.id);

        // Создаём order_items
        const orderItems = items.map((item: any) => ({
            order_id: tempOrder.id,
            product_id: item.productId,
            product_name: item.productName,
            product_price: item.productPrice,
            quantity: item.quantity,
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('❌ Failed to create order items:', itemsError);
            // Удаляем заказ если не удалось создать items
            await supabaseAdmin.from('orders').delete().eq('id', tempOrder.id);
            throw new Error('Failed to create order items');
        }

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
                        // Сохраняем ID нашего заказа (max 127 chars)
                        custom_id: tempOrder.id,
                        description: 'Beauty Salon - Online Shop',
                    },
                ],
                application_context: {
                    brand_name: 'Beauty Salon',
                    locale: 'de-DE',
                    landing_page: 'NO_PREFERENCE',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'PAY_NOW',
                    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?order_id=${tempOrder.id}`,
                    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=1&order_id=${tempOrder.id}`,
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

        return NextResponse.json({
            id: paypalOrder.id,
            orderId: tempOrder.id, // Наш ID заказа в БД
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