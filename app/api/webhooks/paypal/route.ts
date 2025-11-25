// app/api/webhooks/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { isPaymentProcessed, markPaymentAsProcessed } from '@/lib/security/payment-deduplication';
import { createAuditLog } from '@/lib/security/audit-log';

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

        // Payment deduplication check
        const alreadyProcessed = await isPaymentProcessed(resource.id, 'paypal');
        if (alreadyProcessed) {
            console.log('⚠️ Payment already processed:', resource.id);
            await createAuditLog({
                action: 'payment.duplicate_attempt',
                resourceType: 'payment',
                resourceId: resource.id,
                metadata: { orderId: supabaseOrderId, provider: 'paypal' },
            });
            return;
        }

        const { error } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'completed',
                paypal_transaction_id: resource.id,
                status: 'processing',
            })
            .eq('id', supabaseOrderId);

        if (error) {
            console.error('❌ Error updating order:', error);
        } else {
            console.log('✅ Order updated:', supabaseOrderId);

            // Mark payment as processed
            const amount = parseFloat(resource.amount?.value || '0');
            await markPaymentAsProcessed(resource.id, 'paypal', supabaseOrderId, amount);

            // Audit log
            await createAuditLog({
                action: 'payment.completed',
                resourceType: 'payment',
                resourceId: resource.id,
                metadata: {
                    orderId: supabaseOrderId,
                    provider: 'paypal',
                    amount: resource.amount?.value,
                },
            });
        }
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

        if (!supabaseOrderId) return;

        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'refunded',
                status: 'cancelled',
            })
            .eq('id', supabaseOrderId);

        console.log('✅ Order marked as refunded:', supabaseOrderId);
    } catch (error) {
        console.error('❌ handlePaymentRefunded error:', error);
    }
}