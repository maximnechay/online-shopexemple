// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
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
                await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
                break;

            case 'payment_intent.succeeded':
                console.log('✅ Payment succeeded:', event.data.object.id);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
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
        const orderId = session.metadata?.orderId;

        if (!orderId) {
            console.error('❌ No orderId in Stripe session metadata');
            return;
        }

        console.log('💰 Processing successful payment for order:', orderId);

        // Получаем PaymentIntent для деталей платежа
        const paymentIntentId = session.payment_intent as string;

        const { error } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'completed',
                stripe_payment_intent_id: paymentIntentId,
                stripe_session_id: session.id,
                payment_method: 'card',
                status: 'processing', // Заказ оплачен, переводим в обработку
            })
            .eq('id', orderId);

        if (error) {
            console.error('❌ Error updating order:', error);
        } else {
            console.log('✅ Order updated successfully:', orderId);
        }
    } catch (error) {
        console.error('❌ handleCheckoutSessionCompleted error:', error);
    }
}

/**
 * Обработка истечения срока действия checkout сессии
 */
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    try {
        const orderId = session.metadata?.orderId;

        if (!orderId) return;

        console.log('⏰ Checkout session expired for order:', orderId);

        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'failed',
                status: 'cancelled',
                notes: 'Checkout session expired',
            })
            .eq('id', orderId)
            .eq('payment_status', 'pending'); // Обновляем только если ещё pending

        console.log('✅ Order marked as expired:', orderId);
    } catch (error) {
        console.error('❌ handleCheckoutSessionExpired error:', error);
    }
}

/**
 * Обработка неудачного платежа
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
        // Находим заказ по payment_intent_id
        const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .limit(1);

        if (!orders || orders.length === 0) {
            console.log('ℹ️ No order found for failed payment:', paymentIntent.id);
            return;
        }

        const orderId = orders[0].id;

        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'failed',
                status: 'cancelled',
                notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
            })
            .eq('id', orderId);

        console.log('✅ Order marked as failed:', orderId);
    } catch (error) {
        console.error('❌ handlePaymentFailed error:', error);
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