// app/api/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/helpers';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { decreaseStock } from '@/lib/inventory/stock-manager';
import { createAuditLog } from '@/lib/security/audit-log';

// ✅ Используем отдельную переменную для PayPal mode
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API = PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
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
    // Rate limiting - 10 requests per minute for payment capture
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

    try {
        const { orderID } = await request.json();

        if (!orderID) {
            return NextResponse.json(
                { error: 'PayPal Order ID is required' },
                { status: 400 }
            );
        }

        console.log('💰 Capturing PayPal payment:', orderID, 'Mode:', PAYPAL_MODE);

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
            return NextResponse.json(
                { error: 'Failed to capture PayPal payment', details: captureData },
                { status: response.status }
            );
        }

        console.log('✅ PayPal payment captured:', captureData.id);

        // Получаем ID нашего заказа из custom_id
        const supabaseOrderId = captureData.purchase_units[0].payments.captures[0].custom_id ||
            captureData.purchase_units[0].custom_id;

        if (!supabaseOrderId) {
            console.error('❌ No order ID found in PayPal capture');
            return NextResponse.json(
                { error: 'Order ID not found' },
                { status: 400 }
            );
        }

        console.log('🔍 Updating order:', supabaseOrderId);

        // Получаем заказ с items
        const { data: existingOrder, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(product_id, quantity)')
            .eq('id', supabaseOrderId)
            .single();

        if (fetchError || !existingOrder) {
            console.error('❌ Order not found:', supabaseOrderId);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Проверяем, что заказ еще не оплачен
        if (existingOrder.payment_status === 'paid' || existingOrder.payment_status === 'completed') {
            console.log('⚠️ Order already paid, skipping stock decrease');
            return NextResponse.json({
                id: captureData.id,
                status: 'already_processed',
                supabaseOrderId: existingOrder.id,
            });
        }

        const paymentId = captureData.id;

        // 📦 УМЕНЬШАЕМ СКЛАД
        const stockItems = existingOrder.order_items.map((item: any) => ({
            productId: item.product_id,
            quantity: item.quantity,
            notes: `PayPal payment captured for order ${existingOrder.order_number}`,
        }));

        console.log('📦 Decreasing stock for', stockItems.length, 'items');

        const stockResult = await decreaseStock(
            stockItems,
            existingOrder.id,
            paymentId
        );

        if (!stockResult.success) {
            console.error('❌ Failed to decrease stock:', stockResult.error);

            // Критическая ситуация: платёж прошёл, но товара нет
            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'completed',
                    payment_id: paymentId,
                    paypal_transaction_id: paymentId,
                    status: 'pending', // Требует ручной обработки
                    notes: `ВНИМАНИЕ: Недостаточно товара! ${stockResult.error}`,
                })
                .eq('id', existingOrder.id);

            await createAuditLog({
                action: 'payment.completed',
                resourceType: 'order',
                resourceId: existingOrder.id,
                metadata: {
                    provider: 'paypal',
                    paymentId,
                    error: 'insufficient_stock',
                    details: stockResult.error,
                },
            });

            return NextResponse.json(
                {
                    error: 'Insufficient stock',
                    details: stockResult.error,
                    orderId: existingOrder.id,
                    requiresManualReview: true
                },
                { status: 400 }
            );
        }

        console.log('✅ Stock decreased successfully');

        // Получаем данные заказа для проверки купона
        const { data: orderData } = await supabaseAdmin
            .from('orders')
            .select('coupon_code, coupon_discount, user_id')
            .eq('id', supabaseOrderId)
            .single();

        // Сохраняем использование купона если он был применен
        if (orderData?.coupon_code && orderData?.coupon_discount && parseFloat(orderData.coupon_discount) > 0) {
            console.log('🎟️ Recording coupon usage:', orderData.coupon_code);
            
            // Находим купон по коду
            const { data: coupon } = await supabaseAdmin
                .from('coupons')
                .select('id')
                .eq('code', orderData.coupon_code)
                .single();

            if (coupon) {
                // Создаем запись об использовании
                const { error: usageError } = await supabaseAdmin
                    .from('coupon_usages')
                    .insert({
                        coupon_id: coupon.id,
                        order_id: supabaseOrderId,
                        user_id: orderData.user_id || null,
                        discount_amount: parseFloat(orderData.coupon_discount),
                    });

                if (usageError) {
                    console.error('⚠️ Failed to record coupon usage:', usageError);
                } else {
                    console.log('✅ Coupon usage recorded');
                }
            } else {
                console.warn('⚠️ Coupon not found:', orderData.coupon_code);
            }
        }

        // Обновляем существующий заказ статусом оплаты
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'paid',
                payment_id: paymentId,
                status: 'processing',
                paypal_transaction_id: paymentId,
            })
            .eq('id', supabaseOrderId)
            .select('*')
            .single();

        if (orderError || !order) {
            console.error('❌ Error updating order:', orderError);
            return NextResponse.json(
                { error: 'Failed to update order' },
                { status: 500 }
            );
        }

        console.log('✅ Order updated after PayPal payment:', order.id);

        // Audit log
        await createAuditLog({
            action: 'payment.completed',
            resourceType: 'order',
            resourceId: order.id,
            metadata: {
                provider: 'paypal',
                paymentId,
                captureId: captureData.id,
                amount: captureData.purchase_units[0]?.amount?.value,
                stockDecreased: true,
            },
        });

        // Отправляем email подтверждения
        try {
            await sendOrderEmails(order.id);
            console.log('📧 Order emails sent successfully');
        } catch (emailError) {
            console.error('❌ Error sending order emails:', emailError);
        }

        return NextResponse.json({
            id: captureData.id,
            status: captureData.status,
            supabaseOrderId: order.id,
        });
    } catch (error: any) {
        console.error('❌ Error capturing PayPal payment:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}