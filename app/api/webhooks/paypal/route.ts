// app/api/webhooks/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { isPaymentProcessed, markPaymentAsProcessed } from '@/lib/security/payment-deduplication';
import { createAuditLog } from '@/lib/security/audit-log';
import { decreaseStock, increaseStock } from '@/lib/inventory/stock-manager';

const PAYPAL_API = process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Верификация webhook от PayPal
 * Документация: https://developer.paypal.com/api/rest/webhooks/rest/
 */
async function verifyPayPalWebhook(
    webhookId: string,
    headers: Headers,
    body: any
): Promise<boolean> {
    try {
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // Получаем access token
        const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        const { access_token } = await tokenResponse.json();

        // Верифицируем webhook
        const verifyResponse = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify({
                transmission_id: headers.get('paypal-transmission-id'),
                transmission_time: headers.get('paypal-transmission-time'),
                cert_url: headers.get('paypal-cert-url'),
                auth_algo: headers.get('paypal-auth-algo'),
                transmission_sig: headers.get('paypal-transmission-sig'),
                webhook_id: webhookId,
                webhook_event: body,
            }),
        });

        const verifyData = await verifyResponse.json();
        return verifyData.verification_status === 'SUCCESS';
    } catch (error) {
        console.error('❌ PayPal webhook verification error:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.webhook);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    try {
        const body = await request.json();
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;

        console.log('📩 PayPal webhook received:', body.event_type);

        // Верификация webhook (в production обязательно!)
        if (webhookId && process.env.NODE_ENV === 'production') {
            const isValid = await verifyPayPalWebhook(webhookId, request.headers, body);
            if (!isValid) {
                console.error('❌ Invalid PayPal webhook signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const eventType = body.event_type;
        const resource = body.resource;

        switch (eventType) {
            case 'CHECKOUT.ORDER.APPROVED':
                // Пользователь одобрил платёж (но ещё не captured)
                console.log('✅ PayPal order approved:', resource.id);
                break;

            case 'PAYMENT.CAPTURE.COMPLETED':
                // Платёж успешно захвачен
                console.log('💰 PayPal payment captured:', resource.id);
                await handlePaymentCaptured(resource);
                break;

            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.DECLINED':
                // Платёж отклонён
                console.log('❌ PayPal payment denied/declined:', resource.id);
                await handlePaymentFailed(resource);
                break;

            case 'PAYMENT.CAPTURE.REFUNDED':
                // Возврат средств
                console.log('🔄 PayPal payment refunded:', resource.id);
                await handlePaymentRefunded(resource);
                break;

            default:
                console.log('ℹ️ Unhandled PayPal event:', eventType);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('❌ PayPal webhook error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

async function handlePaymentCaptured(resource: any) {
    try {
        // Получаем custom_id или invoice_id, где храним supabaseOrderId
        const supabaseOrderId = resource.custom_id || resource.invoice_id ||
            resource.supplementary_data?.related_ids?.order_id;

        if (!supabaseOrderId) {
            console.error('❌ No Supabase order ID in PayPal webhook');
            return;
        }

        console.log('💰 Processing PayPal payment for order:', supabaseOrderId);

        // PayPal capture ID используем как payment_id
        const paymentId = resource.id;

        // Payment deduplication check
        const alreadyProcessed = await isPaymentProcessed(paymentId, 'paypal');
        if (alreadyProcessed) {
            console.log('⚠️ Payment already processed:', paymentId);
            await createAuditLog({
                action: 'payment.duplicate_attempt',
                resourceType: 'payment',
                resourceId: paymentId,
                metadata: { orderId: supabaseOrderId, provider: 'paypal' },
            });
            return;
        }

        // Получаем заказ с items
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, payment_status, payment_id, order_number, order_items(product_id, quantity)')
            .eq('id', supabaseOrderId)
            .single();

        if (orderError || !order) {
            console.error('❌ Order not found:', supabaseOrderId);
            return;
        }

        // Проверяем, что заказ еще не оплачен
        if (order.payment_status === 'paid' || order.payment_status === 'completed') {
            console.log('⚠️ Order already paid, skipping:', order.id);
            return;
        }

        // 📦 УМЕНЬШАЕМ СКЛАД
        const stockItems = order.order_items.map((item: any) => ({
            productId: item.product_id,
            quantity: item.quantity,
            notes: `PayPal payment confirmed for order ${order.order_number}`,
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
            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'completed',
                    payment_id: paymentId,
                    paypal_transaction_id: paymentId,
                    status: 'pending', // Требует ручной обработки
                    notes: `ВНИМАНИЕ: Недостаточно товара! ${stockResult.error}`,
                })
                .eq('id', order.id);

            await createAuditLog({
                action: 'payment.completed',
                resourceType: 'order',
                resourceId: order.id,
                metadata: {
                    provider: 'paypal',
                    paymentId,
                    error: 'insufficient_stock',
                    details: stockResult.error,
                },
            });

            console.log('⚠️ PayPal payment completed but stock insufficient - requires manual handling');
            return;
        }

        console.log('✅ Stock decreased successfully');

        // Обновляем заказ
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'paid',
                payment_id: paymentId,
                paypal_transaction_id: paymentId,
                status: 'processing',
            })
            .eq('id', order.id);

        if (updateError) {
            console.error('❌ Error updating order:', updateError);

            // Склад уже уменьшен - логируем для расследования
            await createAuditLog({
                action: 'payment.completed',
                resourceType: 'order',
                resourceId: order.id,
                metadata: {
                    provider: 'paypal',
                    error: 'status_update_failed',
                    note: 'Stock decreased but status update failed - REQUIRES MANUAL REVIEW',
                },
            });
        } else {
            console.log('✅ Order updated:', order.id);
        }

        // Mark payment as processed
        const amount = parseFloat(resource.amount?.value || '0');
        await markPaymentAsProcessed(paymentId, 'paypal', order.id, amount);

        // Audit log
        await createAuditLog({
            action: 'payment.completed',
            resourceType: 'payment',
            resourceId: paymentId,
            metadata: {
                orderId: order.id,
                provider: 'paypal',
                amount: resource.amount?.value,
                stockDecreased: true,
            },
        });

        console.log('✅ PayPal payment processing completed for order:', order.id);
    } catch (error) {
        console.error('❌ handlePaymentCaptured error:', error);
    }
}

async function handlePaymentFailed(resource: any) {
    try {
        const supabaseOrderId = resource.custom_id || resource.invoice_id;

        if (!supabaseOrderId) return;

        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'failed',
                status: 'cancelled',
            })
            .eq('id', supabaseOrderId);

        console.log('✅ Order marked as failed:', supabaseOrderId);
    } catch (error) {
        console.error('❌ handlePaymentFailed error:', error);
    }
}

async function handlePaymentRefunded(resource: any) {
    try {
        const supabaseOrderId = resource.custom_id || resource.invoice_id;

        if (!supabaseOrderId) {
            console.log('⚠️ No order ID in refunded resource');
            return;
        }

        console.log('💸 Processing PayPal refund for order:', supabaseOrderId);

        // Получаем заказ с items
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, payment_status, payment_id, order_number, order_items(product_id, quantity)')
            .eq('id', supabaseOrderId)
            .single();

        if (orderError || !order) {
            console.log('ℹ️ Order not found for refund:', supabaseOrderId);
            return;
        }

        // Проверяем, что заказ был оплачен
        if (order.payment_status !== 'paid' && order.payment_status !== 'completed') {
            console.log('⚠️ Order was not paid, skipping stock refund');

            // Всё равно помечаем как refunded
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
            notes: `PayPal refund processed for order ${order.order_number}`,
        }));

        console.log('📦 Returning', stockItems.length, 'items to stock');

        const stockResult = await increaseStock(
            stockItems,
            order.id,
            order.payment_id || resource.id
        );

        if (!stockResult.success) {
            console.error('❌ Failed to return stock:', stockResult.error);

            await createAuditLog({
                action: 'payment.refunded',
                userEmail: 'system',
                resourceType: 'order',
                resourceId: order.id,
                metadata: {
                    provider: 'paypal',
                    error: 'stock_return_failed',
                    details: stockResult.error,
                    note: 'Refund processed but stock return failed - REQUIRES MANUAL REVIEW',
                },
            });
        } else {
            console.log('✅ Stock returned successfully');
        }

        // Обновляем статус
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
                provider: 'paypal',
                refundId: resource.id,
                amount: resource.amount?.value,
                stockReturned: stockResult.success,
            },
        });

        console.log('✅ PayPal refund processed for order:', order.id);
    } catch (error) {
        console.error('❌ handlePaymentRefunded error:', error);
    }
}