import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
});

// чтобы не кешировалось
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const items = body.items as {
            productId: string;
            productName: string;
            productPrice: number; // сейчас в € (10, 20, 45...)
            quantity: number;
        }[];

        const deliveryMethod = body.deliveryMethod as 'delivery' | 'pickup' | undefined;
        const customer = body.customer as {
            name?: string;
            email?: string;
            phone?: string;
        };

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Keine Artikel im Warenkorb' },
                { status: 400 }
            );
        }

        // Линии товаров
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
            (item) => ({
                quantity: item.quantity,
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.productName,
                    },
                    // ВАЖНО: у тебя сейчас price в € → Stripe ждёт в центах
                    unit_amount: Math.round(item.productPrice * 100),
                },
            })
        );

        // Доставка как отдельная позиция (4.99 € если delivery)
        if (deliveryMethod === 'delivery') {
            lineItems.push({
                quantity: 1,
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Versand',
                    },
                    unit_amount: 499, // 4.99 €
                },
            });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            customer_email: customer?.email,
            // Авто-методы (карта, Klarna, Sofort и тд — что включишь в Stripe Dashboard)
            automatic_payment_methods: {
                enabled: true,
            },
            locale: 'de',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=1`,
            metadata: {
                customerName: customer?.name || '',
                customerPhone: customer?.phone || '',
                deliveryMethod: deliveryMethod || '',
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { error: 'Fehler bei Stripe Checkout' },
            { status: 500 }
        );
    }
}
