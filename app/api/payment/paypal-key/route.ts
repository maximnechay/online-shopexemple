// app/api/payment/paypal-key/route.ts
import { NextResponse } from 'next/server';
import { getPaymentSettings, getPayPalClientId } from '@/lib/paymentSettings';

/**
 * Get PayPal client ID based on current mode (test/live)
 * Used by frontend to initialize PayPal SDK
 */
export async function GET() {
    try {
        const settings = await getPaymentSettings();

        // Check if PayPal is enabled
        if (!settings.paypal_enabled) {
            return NextResponse.json(
                { error: 'PayPal is not enabled' },
                { status: 400 }
            );
        }

        const clientId = await getPayPalClientId();

        return NextResponse.json({
            clientId,
            mode: settings.mode,
            currency: settings.currency,
        });
    } catch (error) {
        console.error('Error getting PayPal key:', error);
        return NextResponse.json(
            { error: 'Failed to get PayPal configuration' },
            { status: 500 }
        );
    }
}
