// app/api/payment/stripe-key/route.ts
import { NextResponse } from 'next/server';
import { getPaymentSettings } from '@/lib/paymentSettings';

/**
 * Get Stripe publishable key based on current mode (test/live)
 * Used by frontend to initialize Stripe Elements
 */
export async function GET() {
    try {
        const settings = await getPaymentSettings();

        const isTest = settings.mode === 'test';

        const publishableKey = isTest
            ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
            : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE;

        if (!publishableKey) {
            throw new Error(`Stripe ${isTest ? 'test' : 'live'} publishable key is not configured`);
        }

        return NextResponse.json({
            publishableKey,
            mode: settings.mode,
            currency: settings.currency,
        });
    } catch (error) {
        console.error('Error getting Stripe key:', error);
        return NextResponse.json(
            { error: 'Failed to get Stripe configuration' },
            { status: 500 }
        );
    }
}
