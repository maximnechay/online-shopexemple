// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/helpers';
import { isPaymentProcessed, markPaymentAsProcessed } from '@/lib/security/payment-deduplication';
import { createAuditLog } from '@/lib/security/audit-log';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe Webhook Handler
 * Обрабатывает события от Stripe о платежах
 * 
 * Документация: https://stripe.com/docs/webhooks
 */
export async function POST(request: NextRequest) {
    // Rate limiting для защиты от атак
    const rateLimitResult = rateLimit(request, RATE_LIMITS.webhook);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }

    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            console.error('❌ No Stripe signature found');
            return NextResponse.json(
                { error: 'No signature' },
                { status: 400 }
            );
        }

        let event: Stripe.Event;

        try {
            // Верификация webhook от Stripe
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                webhookSecret
            );
        } catch (err: any) {
            console.error('❌ Webhook signature verification failed:', err.message);
            return NextResponse.json(
                { error: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        console.log('📩 Stripe webhook received:', event.type);

        // Обработка различных событий
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'checkout.session.expired':
                console.log('ℹ️ Checkout session expired - no action needed (order not created yet)');
                break;

            case 'payment_intent.succeeded':
                console.log('✅ Payment succeeded:', event.data.object.id);
                break;

            case 'payment_intent.payment_failed':
                console.log('ℹ️ Payment failed - no action needed (order not created yet)');
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object as Stripe.Charge);
                break;

            default:
                console.log('ℹ️ Unhandled Stripe event:', event.type);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('❌ Stripe webhook error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Обработка успешного завершения checkout сессии
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    try {
        console.log('💰 Processing successful payment, session:', session.id);

        // Защита от дублирования платежа
        if (await isPaymentProcessed(session.id, 'stripe')) {
            console.log('⚠️ Payment already processed, skipping:', session.id);
            return;
        }

        // Проверяем, может заказ уже создан (защита от повторной обработки)
        const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_session_id', session.id)
            .single();

        if (existingOrder) {
            console.log('ℹ️ Order already exists for this session:', existingOrder.id);
            return;
        }

        // Получаем данные из metadata
        const metadata = session.metadata!;
        const items = JSON.parse(metadata.items);

        // 1) Создаём заказ в базе данных
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: metadata.userId || null,
                customer_name: metadata.customerName,
                customer_email: metadata.customerEmail,
                customer_phone: metadata.customerPhone,
                total_amount: parseFloat(metadata.totalAmount),
                delivery_method: metadata.deliveryMethod,
                payment_method: 'card',
                payment_status: 'completed',
                status: 'processing',
                delivery_address: metadata.deliveryAddress,
                delivery_city: metadata.deliveryCity,
                delivery_postal_code: metadata.deliveryPostalCode,
                stripe_payment_intent_id: session.payment_intent as string,
                stripe_session_id: session.id,
            })
            .select('*')
            .single();

        if (orderError) {
            console.error('❌ Error creating order:', orderError);
            return;
        }

        console.log('✅ Order created after payment:', order.id);

        // 2) Создаём order_items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            product_price: item.productPrice,
            quantity: item.quantity,
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('❌ Error creating order items:', itemsError);
            // Удаляем заказ если items не создались
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return;
        }

        console.log('✅ Order items created');

        // Отмечаем платёж как обработанный
        await markPaymentAsProcessed(
            session.id,
            'stripe',
            order.id,
            session.amount_total ? session.amount_total / 100 : 0
        );

        // Audit log
        await createAuditLog({
            action: 'order.create',
            userEmail: session.customer_details?.email || 'unknown',
            resourceType: 'order',
            resourceId: order.id,
            metadata: {
                source: 'stripe_webhook',
                sessionId: session.id,
                amount: session.amount_total,
            },
        });

        // 3) Отправляем email подтверждения
        try {
            await sendOrderEmails(order.id);
            console.log('📧 Order emails sent successfully');
        } catch (emailError) {
            console.error('❌ Error sending order emails:', emailError);
            // Не прерываем выполнение, если email не отправился
        }
    } catch (error) {
        console.error('❌ handleCheckoutSessionCompleted error:', error);
    }
}

/**
 * Обработка возврата средств
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
    try {
        const paymentIntentId = charge.payment_intent as string;

        if (!paymentIntentId) return;

        const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .limit(1);

        if (!orders || orders.length === 0) {
            console.log('ℹ️ No order found for refunded charge:', charge.id);
            return;
        }

        const orderId = orders[0].id;

        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'refunded',
                status: 'cancelled',
            })
            .eq('id', orderId);

        console.log('✅ Order marked as refunded:', orderId);
    } catch (error) {
        console.error('❌ handleChargeRefunded error:', error);
    }
}