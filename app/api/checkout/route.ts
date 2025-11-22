// app/api/checkout/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
    try {
        const { items, customer, deliveryMethod, address, userId } = await req.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Keine Artikel im Warenkorb' }, { status: 400 });
        }

        console.log('🛒 Creating order with items:', items);

        // считаем сумму в €
        const total = items.reduce(
            (sum: number, item: any) => sum + item.productPrice * item.quantity,
            0
        );

        // готовим адрес для записи в orders
        let delivery_address: string;
        let delivery_city: string | null;
        let delivery_postal_code: string | null;

        if (deliveryMethod === 'delivery') {
            delivery_address = `${address?.street ?? ''} ${address?.houseNumber ?? ''}`.trim();
            delivery_city = address?.city ?? '';
            delivery_postal_code = address?.postalCode ?? '';
        } else {
            // самовывоз — чтобы не было null в NOT NULL колонках
            delivery_address = 'Abholung im Salon';
            delivery_city = 'Hannover';
            delivery_postal_code = '0';
        }

        // 1) создаём заказ в Supabase
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId || null,
                customer_name: customer.name,
                customer_email: customer.email,
                customer_phone: customer.phone,
                total_amount: total,
                delivery_method: deliveryMethod,
                payment_method: 'card',
                status: 'pending',
                delivery_address,
                delivery_city,
                delivery_postal_code,
                notes: null,
            })
            .select('*')
            .single();

        if (orderError) {
            console.error('❌ Order insert error:', orderError);
            return NextResponse.json(
                { error: 'Fehler beim Speichern der Bestellung' },
                { status: 500 }
            );
        }

        console.log('✅ Order created:', order.id);

        // 2) создаём order_items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            product_price: item.productPrice,
            quantity: item.quantity,
        }));

        console.log('📦 Creating order items:', orderItems);

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('❌ Order items creation error:', itemsError);
            // Удаляем заказ если items не создались
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return NextResponse.json(
                { error: 'Fehler beim Erstellen der Bestellpositionen', details: itemsError.message },
                { status: 500 }
            );
        }

        console.log('✅ Order items created');

        // 3) создаём Stripe session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: items.map((item: any) => ({
                price_data: {
                    currency: 'eur',
                    unit_amount: Math.round(item.productPrice * 100),
                    product_data: {
                        name: item.productName,
                    },
                },
                quantity: item.quantity,
            })),
            customer_email: customer.email,
            metadata: {
                orderId: order.id,
            },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success/${order.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=1`,
        });

        console.log('✅ Stripe session created:', session.id);

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('❌ Stripe error:', err);
        return NextResponse.json({ error: err.message ?? 'Stripe error' }, { status: 500 });
    }
}