// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { createAuditLog } from '@/lib/security/audit-log';
import { checkAvailability } from '@/lib/inventory/stock-manager';

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
            firstName,
            lastName,
            email,
            phone,
            street,
            houseNumber,
            postalCode,
            city,
            deliveryMethod,
            paymentMethod,
            notes,
            items,
            subtotal,
            shipping,
            total,
        } = body;

        console.log('📝 Creating order with data:', { firstName, lastName, email, phone, itemsCount: items?.length });

        if (!firstName || !lastName || !email || !phone) {
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

        // ✅ Check stock availability BEFORE creating order
        // This is a soft check - we don't reserve stock yet
        console.log('🔍 Checking stock availability for', items.length, 'items');
        const availability = await checkAvailability(
            items.map((item: any) => ({
                productId: item.id,
                quantity: item.quantity
            }))
        );

        if (!availability.available) {
            const unavailableItems = availability.unavailableItems
                .map(item => `${item.productName}: benötigt ${item.requested}, verfügbar ${item.inStock}`)
                .join('; ');

            console.warn('❌ Insufficient stock:', unavailableItems);

            return NextResponse.json(
                {
                    error: 'Nicht genügend Lagerbestand',
                    unavailableItems: availability.unavailableItems,
                    message: `Folgende Artikel sind nicht verfügbar: ${unavailableItems}`
                },
                { status: 400 }
            );
        }

        console.log('✅ All items available in stock');

        // Generate unique order number AND payment_id for cash orders
        const orderNumber = `ORD-${Date.now()}`;
        const paymentId = paymentMethod === 'cash'
            ? `CASH-${Date.now()}-${Math.random().toString(36).substring(7)}`
            : null; // Will be set by payment provider webhook for card/paypal

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                order_number: orderNumber,
                payment_id: paymentId, // 🔑 Store payment_id for idempotency
                user_id: userId || null,
                email: email,
                phone: phone,
                first_name: firstName,
                last_name: lastName,
                street: street || '',
                house_number: houseNumber || '',
                postal_code: postalCode || '',
                city: city || '',
                delivery_method: deliveryMethod,
                payment_method: paymentMethod,
                subtotal: subtotal || 0,
                shipping: shipping || 0,
                total: total || 0,
                notes: notes || null,
                status: 'pending',
                payment_status: paymentMethod === 'cash' ? 'pending' : 'pending', // Cash orders start as pending
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
            product_id: item.id,
            product_name: item.name,
            product_price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
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
            userEmail: email,
            resourceType: 'order',
            resourceId: order.id,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
                orderNumber,
                paymentId,
                total: total || 0,
                paymentMethod,
                itemsCount: items.length,
                stockReserved: false, // Stock not decreased yet - only on payment confirmation
            },
        });

        console.log('✅ Order created successfully:', order.id, '- Stock NOT decreased yet');

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
