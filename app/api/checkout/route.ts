// app/api/checkout/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { validateRequest, checkoutSchema } from '@/lib/security/validation';
import { createAuditLog } from '@/lib/security/audit-log';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
    timeout: 10000, // 10 seconds timeout
});

const STRIPE_TIMEOUT = 15000; // 15 seconds for Stripe API calls

export async function POST(req: NextRequest) {
    // Rate limiting - 10 requests per minute for payment creation
    const rateLimitResult = rateLimit(req, RATE_LIMITS.payment);
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
    const timeout = setTimeout(() => controller.abort(), STRIPE_TIMEOUT);

    try {
        const body = await req.json();

        // ✅ INPUT VALIDATION
        const validation = validateRequest(checkoutSchema, body);
        if (!validation.success) {
            console.error('❌ Checkout validation failed:', validation.errors);
            return NextResponse.json(
                {
                    error: 'Ungültige Eingabedaten',
                    details: validation.errors
                },
                { status: 400 }
            );
        }

        const { items, customer, deliveryMethod, address, userId } = validation.data;

        console.log('🛒 Preparing checkout with items:', items.length);

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
        for (const item of items) {
            const product = products.find(p => p.id === item.id);

            if (!product) {
                return NextResponse.json(
                    { error: `Produkt ${item.name} nicht gefunden` },
                    { status: 400 }
                );
            }

            if (!product.in_stock) {
                return NextResponse.json(
                    { error: `Produkt ${item.name} ist nicht verfügbar` },
                    { status: 400 }
                );
            }

            if (product.stock_quantity < item.quantity) {
                return NextResponse.json(
                    {
                        error: `Nicht genügend Lagerbestand für ${item.name}. Verfügbar: ${product.stock_quantity}`
                    },
                    { status: 400 }
                );
            }

            // Проверяем что цена из корзины совпадает с текущей ценой
            const priceDifference = Math.abs(Number(product.price) - item.price);
            if (priceDifference > 0.01) { // Допускаем погрешность 1 цент
                return NextResponse.json(
                    {
                        error: `Цена товара ${item.name} изменилась. Пожалуйста, обновите корзину.`
                    },
                    { status: 400 }
                );
            }
        }

        // ✅ CALCULATE TOTAL
        const total = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // Проверка минимальной суммы заказа
        const MIN_ORDER_AMOUNT = 5; // €5
        if (total < MIN_ORDER_AMOUNT) {
            return NextResponse.json(
                { error: `Минимальная сумма заказа: €${MIN_ORDER_AMOUNT}` },
                { status: 400 }
            );
        }

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

        // ✅ CREATE STRIPE SESSION WITH TIMEOUT
        const sessionPromise = stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: items.map((item) => ({
                price_data: {
                    currency: 'eur',
                    unit_amount: Math.round(item.price * 100),
                    product_data: {
                        name: item.name,
                        description: `Menge: ${item.quantity}`,
                    },
                },
                quantity: item.quantity,
            })),
            customer_email: customer.email,
            metadata: {
                // Сохраняем все данные заказа в metadata для создания после оплаты
                userId: userId || '',
                firstName: customer.firstName,
                lastName: customer.lastName,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                totalAmount: total.toFixed(2),
                deliveryMethod: deliveryMethod,
                deliveryAddress: delivery_address,
                deliveryCity: delivery_city,
                deliveryPostalCode: delivery_postal_code,
                itemsJson: JSON.stringify(items.map((item) => ({
                    productId: item.id,
                    productName: item.name,
                    productPrice: item.price,
                    quantity: item.quantity,
                }))),
            },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=1`,
            expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 минут
        });

        // Race between Stripe call and timeout
        const session = await Promise.race([
            sessionPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Stripe API timeout')), STRIPE_TIMEOUT)
            )
        ]) as Stripe.Checkout.Session;

        console.log('✅ Stripe session created:', session.id);

        // ✅ AUDIT LOGGING - с правильной обработкой null значений
        await createAuditLog({
            action: 'checkout.session_created',
            resourceType: 'stripe_session',
            resourceId: session.id,
            userId: userId || undefined,  // ✅ ИСПРАВЛЕНО: конвертируем null в undefined
            userEmail: customer.email,
            ipAddress: req.headers.get('x-forwarded-for') || undefined,  // ✅ ИСПРАВЛЕНО
            userAgent: req.headers.get('user-agent') || undefined,       // ✅ ИСПРАВЛЕНО
            metadata: {
                amount: total,
                itemsCount: items.length,
                deliveryMethod,
            },
        }).catch(err => {
            console.error('⚠️ Failed to create audit log:', err);
            // Не прерываем процесс если audit log не создался
        });

        return NextResponse.json({
            url: session.url,
            sessionId: session.id
        });

    } catch (err: any) {
        console.error('❌ Checkout error:', err);

        // Специальная обработка timeout ошибок
        if (err.message === 'Stripe API timeout' || err.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Die Anfrage dauerte zu lange. Bitte versuchen Sie es erneut.' },
                { status: 504 }
            );
        }

        // Специальная обработка Stripe ошибок
        if (err.type === 'StripeCardError') {
            return NextResponse.json(
                { error: 'Kartenfehler. Bitte überprüfen Sie Ihre Kartendaten.' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: err.message ?? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
            { status: 500 }
        );
    } finally {
        clearTimeout(timeout);
    }
}