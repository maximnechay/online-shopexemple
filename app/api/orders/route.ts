// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { createAuditLog } from '@/lib/security/audit-log';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');
        const orderId = searchParams.get('order_id');

        console.log('🔍 GET /api/orders - sessionId:', sessionId, 'orderId:', orderId);

        if (!sessionId && !orderId) {
            return NextResponse.json(
                { error: 'Session ID or Order ID erforderlich' },
                { status: 400 }
            );
        }

        let order;
        let error;

        if (sessionId) {
            // Ищем заказ по Stripe session ID
            console.log('🔍 Searching for order by stripe_session_id:', sessionId);
            const result = await supabaseAdmin
                .from('orders')
                .select('*, items:order_items(*)')
                .eq('stripe_session_id', sessionId)
                .single();

            order = result.data;
            error = result.error;
            console.log('📊 Query result:', { found: !!order, error: error?.message });
        } else if (orderId) {
            // Ищем заказ по ID (для PayPal)
            console.log('🔍 Searching for order by id:', orderId);
            const result = await supabaseAdmin
                .from('orders')
                .select('*, items:order_items(*)')
                .eq('id', orderId)
                .single();

            order = result.data;
            error = result.error;
            console.log('📊 Query result:', { found: !!order, error: error?.message });
        }

        if (error || !order) {
            console.error('❌ Order not found');
            return NextResponse.json(
                { error: 'Bestellung nicht gefunden' },
                { status: 404 }
            );
        }

        console.log('✅ Order found:', order.id);
        return NextResponse.json({ order });
    } catch (error: any) {
        console.error('Get order error:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.createOrder);
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

        const {
            userId,
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            deliveryCity,
            deliveryPostalCode,
            deliveryMethod,
            paymentMethod,
            notes,
            items,
        } = body;

        if (!customerName || !customerEmail || !customerPhone) {
            return NextResponse.json(
                { error: 'Fehlende Kundendaten' },
                { status: 400 }
            );
        }

        if (!deliveryMethod || !paymentMethod) {
            return NextResponse.json(
                { error: 'Fehlende Liefer- oder Zahlungsmethode' },
                { status: 400 }
            );
        }

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Warenkorb ist leer' },
                { status: 400 }
            );
        }

        const totalAmount = items.reduce(
            (sum: number, item: any) => sum + item.productPrice * item.quantity,
            0
        );

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId || null,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                delivery_address: deliveryAddress || 'Самовывоз',
                delivery_city: deliveryCity || 'Salon',
                delivery_postal_code: deliveryPostalCode || null,
                delivery_method: deliveryMethod,
                payment_method: paymentMethod,
                total_amount: totalAmount,
                notes: notes || null,
                status: 'pending',
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error('Order creation error:', orderError);
            return NextResponse.json(
                { error: 'Fehler beim Erstellen der Bestellung', details: orderError?.message },
                { status: 500 }
            );
        }

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
            console.error('Order items creation error:', itemsError);
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return NextResponse.json(
                { error: 'Fehler beim Erstellen der Bestellpositionen', details: itemsError.message },
                { status: 500 }
            );
        }

        // Audit log
        await createAuditLog({
            action: 'order.create',
            userEmail: customerEmail,
            resourceType: 'order',
            resourceId: order.id,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
                totalAmount,
                paymentMethod,
                itemsCount: items.length,
            },
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            order,
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler', details: error.message },
            { status: 500 }
        );
    }
}
