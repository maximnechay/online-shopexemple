// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
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
