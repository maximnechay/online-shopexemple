import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: body.items,
            automatic_payment_methods: { enabled: true },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=1`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Stripe error" }, { status: 500 });
    }
}
