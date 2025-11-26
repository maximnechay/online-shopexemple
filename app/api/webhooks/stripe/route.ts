// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/helpers';
import { isPaymentProcessed, markPaymentAsProcessed } from '@/lib/security/payment-deduplication';
import { createAuditLog } from '@/lib/security/audit-log';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { decreaseStock, increaseStock } from '@/lib/inventory/stock-manager';
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
 * ВАЖНО: Только здесь уменьшается склад при подтверждении оплаты
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    try {
        console.log('💰 Processing successful payment, session:', session.id);

        // Используем session.id как payment_id для идемпотентности
        const paymentId = session.id;

        // 🔒 IDEMPOTENCY: Проверяем, не обработан ли уже этот платёж
        const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id, payment_status')
            .eq('payment_id', paymentId)
            .single();

        if (existingOrder) {
            if (existingOrder.payment_status === 'paid' || existingOrder.payment_status === 'completed') {
                console.log('⚠️ Payment already processed for order:', existingOrder.id);
                return;
            }
            console.log('ℹ️ Order exists but not paid yet, continuing...');
        }

        // Legacy check для старых заказов
        if (!existingOrder) {
            const { data: legacyOrder } = await supabaseAdmin
                .from('orders')
                .select('id')
                .eq('stripe_session_id', session.id)
                .single();

            if (legacyOrder) {
                console.log('⚠️ Legacy order already exists, skipping:', legacyOrder.id);
                return;
            }
        }

        // Защита от дублирования через отдельную таблицу
        if (await isPaymentProcessed(session.id, 'stripe')) {
            console.log('⚠️ Payment already marked as processed:', session.id);
            return;
        }

        // Получаем данные из metadata
        const metadata = session.metadata!;
        const items = JSON.parse(metadata.itemsJson || metadata.items);

        console.log('📦 Order items:', items.length);

        // 1) Создаём заказ в базе данных
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                payment_id: paymentId, // 🔑 Уникальный ID для идемпотентности
                user_id: metadata.userId || null,
                first_name: metadata.firstName,
                last_name: metadata.lastName,
                email: metadata.customerEmail,
                phone: metadata.customerPhone,
                street: metadata.deliveryAddress?.split(' ')[0] || '',
                house_number: metadata.deliveryAddress?.split(' ').slice(1).join(' ') || '',
                city: metadata.deliveryCity || '',
                postal_code: metadata.deliveryPostalCode || '',
                subtotal: parseFloat(metadata.totalAmount) || 0,
                shipping: 0,
                total: parseFloat(metadata.totalAmount),
                delivery_method: metadata.deliveryMethod,
                payment_method: 'card',
                payment_status: 'pending', // Сначала pending
                status: 'pending',
                order_number: `ORD-${Date.now()}`,
                stripe_payment_intent_id: session.payment_intent as string,
                stripe_session_id: session.id,
            })
            .select('*')
            .single();

        if (orderError) {
            console.error('❌ Error creating order:', orderError);
            throw new Error('Failed to create order');
        }

        console.log('✅ Order created:', order.id);

        // 2) Создаём order_items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            product_price: item.productPrice,
            quantity: item.quantity,
            total: item.productPrice * item.quantity,
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('❌ Error creating order items:', itemsError);
            // Удаляем заказ если items не создались
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            throw new Error('Failed to create order items');
        }

        console.log('✅ Order items created');

        // 3) 📦 УМЕНЬШАЕМ СКЛАД (критически важный шаг!)
        const stockItems = items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: `Stripe payment confirmed for order ${order.order_number}`,
        }));

        console.log('📦 Decreasing stock for', stockItems.length, 'items');

        const stockResult = await decreaseStock(
            stockItems,
            order.id,
            paymentId
        );

        if (!stockResult.success) {
            console.error('❌ Failed to decrease stock:', stockResult.error);

            // Критическая ошибка: платёж прошёл, но товара нет
            // Помечаем заказ как проблемный
            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'completed', // Платёж прошёл
                    status: 'pending', // Но требует ручной обработки
                    notes: `ВНИМАНИЕ: Недостаточно товара! ${stockResult.error}`,
                })
                .eq('id', order.id);

            // Логируем для расследования
            await createAuditLog({
                action: 'payment.completed',
                userEmail: session.customer_details?.email || 'unknown',
                resourceType: 'order',
                resourceId: order.id,
                metadata: {
                    source: 'stripe_webhook',
                    sessionId: session.id,
                    error: 'insufficient_stock',
                    details: stockResult.error,
                },
            });

            console.log('⚠️ Order created but stock insufficient - requires manual handling');
            return; // Не отправляем email, не меняем статус
        }

        console.log('✅ Stock decreased successfully');

        // 4) Обновляем статус заказа на paid и processing
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'paid',
                status: 'processing',
            })
            .eq('id', order.id);

        if (updateError) {
            console.error('❌ Error updating order status:', updateError);
            // Склад уже уменьшен, это проблема - логируем
            await createAuditLog({
                action: 'payment.completed',
                userEmail: session.customer_details?.email || 'unknown',
                resourceType: 'order',
                resourceId: order.id,
                metadata: {
                    error: 'status_update_failed',
                    note: 'Stock decreased but status update failed - REQUIRES MANUAL REVIEW',
                },
            });
        }

        // Отмечаем платёж как обработанный
        await markPaymentAsProcessed(
            session.id,
            'stripe',
            order.id,
            session.amount_total ? session.amount_total / 100 : 0
        );

        // Audit log
        await createAuditLog({
            action: 'payment.completed',
            userEmail: session.customer_details?.email || 'unknown',
            resourceType: 'order',
            resourceId: order.id,
            metadata: {
                source: 'stripe_webhook',
                sessionId: session.id,
                amount: session.amount_total,
                stockDecreased: true,
            },
        });

        // 5) Отправляем email подтверждения
        try {
            await sendOrderEmails(order.id);
            console.log('📧 Order emails sent successfully');
        } catch (emailError) {
            console.error('❌ Error sending order emails:', emailError);
            // Не прерываем выполнение, если email не отправился
        }

        console.log('✅ Stripe payment processing completed for order:', order.id);
    } catch (error) {
        console.error('❌ handleCheckoutSessionCompleted error:', error);
        // Важно не бросать ошибку, чтобы Stripe не ретраил webhook
    }
}

/**
 * Обработка возврата средств
 * ВАЖНО: Возвращаем товар на склад
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
    try {
        const paymentIntentId = charge.payment_intent as string;

        if (!paymentIntentId) {
            console.log('⚠️ No payment intent in refunded charge');
            return;
        }

        console.log('💸 Processing refund for payment:', paymentIntentId);

        // Находим заказ по payment_intent_id
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, payment_status, payment_id, order_number, order_items(product_id, quantity)')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single();

        if (orderError || !order) {
            console.log('ℹ️ No order found for refunded charge:', paymentIntentId);
            return;
        }

        console.log('📦 Found order for refund:', order.id);

        // Проверяем, что заказ был оплачен (нельзя вернуть то, что не списывалось)
        if (order.payment_status !== 'paid' && order.payment_status !== 'completed') {
            console.log('⚠️ Order was not paid, skipping stock refund');

            // Всё равно помечаем как refunded для корректного отображения
            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'refunded',
                    status: 'cancelled',
                })
                .eq('id', order.id);

            return;
        }

        // 📦 ВОЗВРАЩАЕМ ТОВАР НА СКЛАД
        const stockItems = order.order_items.map((item: any) => ({
            productId: item.product_id,
            quantity: item.quantity,
            notes: `Refund processed for order ${order.order_number}`,
        }));

        console.log('📦 Returning', stockItems.length, 'items to stock');

        const stockResult = await increaseStock(
            stockItems,
            order.id,
            order.payment_id || paymentIntentId
        );

        if (!stockResult.success) {
            console.error('❌ Failed to return stock:', stockResult.error);

            // Логируем ошибку но продолжаем
            await createAuditLog({
                action: 'payment.refunded',
                userEmail: 'system',
                resourceType: 'order',
                resourceId: order.id,
                metadata: {
                    error: 'stock_return_failed',
                    details: stockResult.error,
                    note: 'Refund processed but stock return failed - REQUIRES MANUAL REVIEW',
                },
            });
        } else {
            console.log('✅ Stock returned successfully');
        }

        // Обновляем статус заказа
        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'refunded',
                status: 'cancelled',
            })
            .eq('id', order.id)
            .eq('payment_status', order.payment_status); // Optimistic locking

        // Audit log
        await createAuditLog({
            action: 'payment.refunded',
            userEmail: 'system',
            resourceType: 'order',
            resourceId: order.id,
            metadata: {
                source: 'stripe_webhook',
                chargeId: charge.id,
                amount: charge.amount_refunded,
                stockReturned: stockResult.success,
            },
        });

        console.log('✅ Refund processed for order:', order.id);
    } catch (error) {
        console.error('❌ handleChargeRefunded error:', error);
    }
}