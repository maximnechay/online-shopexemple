import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
});

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing session_id' },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        const orderId = session.metadata?.orderId;
        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId not found in metadata' },
                { status: 404 }
            );
        }

        return NextResponse.json({ orderId });
    } catch (err: any) {
        console.error('Error loading stripe session:', err);
        return NextResponse.json(
            { error: err.message ?? 'Stripe session error' },
            { status: 500 }
        );
    }
}
