// app/api/paypal/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { validateRequest, checkoutSchema } from '@/lib/security/validation';
import { createAuditLog } from '@/lib/security/audit-log';

// ✅ Используем отдельную переменную для PayPal mode
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API = PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const PAYPAL_TIMEOUT = 15000; // 15 seconds

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

    // ✅ Timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s for token

    try {
        const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
            signal: controller.signal,
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
    } finally {
        clearTimeout(timeout);
    }
}

export async function POST(request: NextRequest) {
    // Rate limiting - 10 requests per minute for payment creation
    const rateLimitResult = rateLimit(request, RATE_LIMITS.payment);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PAYPAL_TIMEOUT);

    try {
        const body = await request.json();

        // ✅ ДОБАВЬ ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ
        console.log('📦 Received PayPal request body:', JSON.stringify(body, null, 2));
        console.log('📊 Body structure:', {
            hasItems: !!body.items,
            itemsCount: body.items?.length,
            hasCustomer: !!body.customer,
            customerKeys: body.customer ? Object.keys(body.customer) : [],
            hasAddress: !!body.address,
            addressKeys: body.address ? Object.keys(body.address) : [],
            deliveryMethod: body.deliveryMethod,
            userId: body.userId,
        });

        // ✅ INPUT VALIDATION - используем ту же схему что и для Stripe
        const validation = validateRequest(checkoutSchema, body);
        if (!validation.success) {
            console.error('❌ PayPal checkout validation failed:');
            console.error('Validation errors:', JSON.stringify(validation.errors, null, 2));
            console.error('Failed body:', JSON.stringify(body, null, 2));

            return NextResponse.json(
                {
                    error: 'Ungültige Eingabedaten',
                    details: validation.errors  // Клиент тоже увидит детали
                },
                { status: 400 }
            );
        }

        const { items, customer, deliveryMethod, address, userId, discount, couponCode } = validation.data;

        console.log('🔍 Creating PayPal order with items:', items.length);

        // ✅ BUSINESS LOGIC VALIDATION
        // Проверяем что все товары существуют и доступны
        const productIds = items.map(item => item.id);
        const { data: products, error: productsError } = await supabaseAdmin
            .from('products')
            .select('id, price, stock_quantity, in_stock')
            .in('id', productIds);

        if (productsError || !products) {
            console.error('❌ Failed to fetch products:', productsError);
            return NextResponse.json(
                { error: 'Fehler beim Abrufen der Produkte' },
                { status: 500 }
            );
        }

        // Проверяем наличие и цены товаров
        // Проверяем наличие и цены товаров
        for (const item of items) {
            const product = products.find(p => p.id === item.id);

            if (!product) {
                return NextResponse.json(
                    { error: `Produkt ${item.name} nicht gefunden` },
                    { status: 400 }
                );
            }

            // Если есть variantId - проверяем цену и наличие варианта
            if (item.variantId) {
                const { data: variant } = await supabaseAdmin
                    .from('product_variants')
                    .select('id, price, stock_quantity, in_stock')
                    .eq('id', item.variantId)
                    .single();

                if (!variant) {
                    return NextResponse.json(
                        { error: `Variante für ${item.name} nicht gefunden` },
                        { status: 400 }
                    );
                }

                if (!variant.in_stock) {
                    return NextResponse.json(
                        { error: `${item.name} ist nicht verfügbar` },
                        { status: 400 }
                    );
                }

                if (variant.stock_quantity < item.quantity) {
                    return NextResponse.json(
                        { error: `Nicht genügend Lagerbestand für ${item.name}. Verfügbar: ${variant.stock_quantity}` },
                        { status: 400 }
                    );
                }

                const priceDifference = Math.abs(Number(variant.price) - item.price);
                if (priceDifference > 0.01) {
                    return NextResponse.json(
                        { error: `Preis für ${item.name} hat sich geändert. Bitte aktualisieren Sie Ihren Warenkorb.` },
                        { status: 400 }
                    );
                }
            } else {
                // Обычный продукт без варианта
                if (!product.in_stock) {
                    return NextResponse.json(
                        { error: `${item.name} ist nicht verfügbar` },
                        { status: 400 }
                    );
                }

                if (product.stock_quantity < item.quantity) {
                    return NextResponse.json(
                        { error: `Nicht genügend Lagerbestand für ${item.name}. Verfügbar: ${product.stock_quantity}` },
                        { status: 400 }
                    );
                }

                const priceDifference = Math.abs(Number(product.price) - item.price);
                if (priceDifference > 0.01) {
                    return NextResponse.json(
                        { error: `Preis für ${item.name} hat sich geändert. Bitte aktualisieren Sie Ihren Warenkorb.` },
                        { status: 400 }
                    );
                }
            }
        }

        // ✅ CALCULATE TOTAL
        const subtotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // Apply discount if provided
        const discountAmount = discount || 0;
        const amount = Math.max(0, subtotal - discountAmount);

        // Проверка минимальной суммы заказа
        const MIN_ORDER_AMOUNT = 5; // €5
        if (amount < MIN_ORDER_AMOUNT) {
            return NextResponse.json(
                { error: `Минимальная сумма заказа: €${MIN_ORDER_AMOUNT}` },
                { status: 400 }
            );
        }

        console.log('💰 Order amount:', amount);

        // ✅ PREPARE ADDRESS
        let delivery_address: string;
        let delivery_city: string;
        let delivery_postal_code: string;

        if (deliveryMethod === 'delivery') {
            if (!address) {
                return NextResponse.json(
                    { error: 'Адрес доставки обязателен' },
                    { status: 400 }
                );
            }
            delivery_address = `${address.street} ${address.houseNumber}`.trim();
            delivery_city = address.city;
            delivery_postal_code = address.postalCode;
        } else {
            delivery_address = 'Abholung im Salon';
            delivery_city = 'Hannover';
            delivery_postal_code = '0';
        }

        // ✅ GET ACCESS TOKEN
        const accessToken = await getPayPalAccessToken();

        // Создаём временный заказ в БД для хранения данных
        // PayPal custom_id имеет лимит 127 символов, поэтому используем DB
        const { data: tempOrder, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId || null,
                first_name: customer.firstName,
                last_name: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                street: address?.street || '',
                house_number: address?.houseNumber || '',
                postal_code: delivery_postal_code,
                city: delivery_city,
                delivery_method: deliveryMethod,
                payment_method: 'paypal',
                subtotal: subtotal,
                shipping: 0,
                coupon_discount: discountAmount,
                coupon_code: couponCode || null,
                total: amount,
                order_number: `ORD-${Date.now()}`,
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
        const orderItems = items.map((item) => ({
            order_id: tempOrder.id,
            product_id: item.id,
            variant_id: item.variantId || null,
            product_name: item.name,
            product_price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
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

        // ✅ CREATE PAYPAL ORDER WITH TIMEOUT
        console.log('📦 Creating PayPal order...');

        const paypalOrderPromise = fetch(`${PAYPAL_API}/v2/checkout/orders`, {
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
            signal: controller.signal,
        });

        // Race between PayPal call and timeout
        const response = await Promise.race([
            paypalOrderPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('PayPal API timeout')), PAYPAL_TIMEOUT)
            )
        ]) as Response;

        const paypalOrder = await response.json();

        if (!response.ok) {
            console.error('❌ PayPal order creation error:', {
                status: response.status,
                statusText: response.statusText,
                details: paypalOrder
            });

            // Удаляем временный заказ при ошибке PayPal
            await supabaseAdmin.from('order_items').delete().eq('order_id', tempOrder.id);
            await supabaseAdmin.from('orders').delete().eq('id', tempOrder.id);

            return NextResponse.json(
                { error: 'Failed to create PayPal order', details: paypalOrder },
                { status: response.status }
            );
        }

        console.log('✅ PayPal order created:', paypalOrder.id);

        // ✅ AUDIT LOGGING
        await createAuditLog({
            action: 'order.create',
            resourceType: 'paypal_order',
            resourceId: tempOrder.id,
            userId: userId || undefined,
            userEmail: customer.email,
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            metadata: {
                paypalOrderId: paypalOrder.id,
                amount: amount,
                itemsCount: items.length,
                deliveryMethod,
            },
        }).catch(err => {
            console.error('⚠️ Failed to create audit log:', err);
            // Не прерываем процесс если audit log не создался
        });

        return NextResponse.json({
            id: paypalOrder.id,
            orderId: tempOrder.id, // Наш ID заказа в БД
        });

    } catch (error: any) {
        console.error('❌ Error creating PayPal order:', {
            message: error.message,
            stack: error.stack
        });

        // Специальная обработка timeout ошибок
        if (error.message === 'PayPal API timeout' || error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Die Anfrage dauerte zu lange. Bitte versuchen Sie es erneut.' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    } finally {
        clearTimeout(timeout);
    }
}