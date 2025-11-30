import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { validateSchema, checkoutSessionSchema } from '@/lib/validation/schemas';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
});

export async function GET(req: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(req, RATE_LIMITS.payment);
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
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');

        // ✅ Zod validation
        const validation = validateSchema(checkoutSessionSchema, { session_id: sessionId });
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid session_id', details: validation.errors },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.retrieve(validation.data.session_id);

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
