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

        console.log('🛒 Preparing checkout with items:', items);

        // Считаем сумму в €
        const total = items.reduce(
            (sum: number, item: any) => sum + item.productPrice * item.quantity,
            0
        );

        // Готовим адрес для метаданных
        let delivery_address: string;
        let delivery_city: string;
        let delivery_postal_code: string;

        if (deliveryMethod === 'delivery') {
            delivery_address = `${address?.street ?? ''} ${address?.houseNumber ?? ''}`.trim();
            delivery_city = address?.city ?? '';
            delivery_postal_code = address?.postalCode ?? '';
        } else {
            delivery_address = 'Abholung im Salon';
            delivery_city = 'Hannover';
            delivery_postal_code = '0';
        }

        // Создаём Stripe сессию БЕЗ создания заказа
        // Заказ будет создан в webhook после успешной оплаты
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
                // Сохраняем все данные заказа в metadata для создания после оплаты
                userId: userId || '',
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                totalAmount: total.toString(),
                deliveryMethod: deliveryMethod,
                deliveryAddress: delivery_address,
                deliveryCity: delivery_city,
                deliveryPostalCode: delivery_postal_code,
                items: JSON.stringify(items),
            },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=1`,
        });

        console.log('✅ Stripe session created:', session.id);

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('❌ Stripe error:', err);
        return NextResponse.json({ error: err.message ?? 'Stripe error' }, { status: 500 });
    }
}