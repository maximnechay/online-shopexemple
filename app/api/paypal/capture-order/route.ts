// app/api/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYPAL_API = process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getPayPalAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
}

export async function POST(request: NextRequest) {
    try {
        const { orderID, supabaseOrderId } = await request.json();

        if (!orderID) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const accessToken = await getPayPalAccessToken();

        // Capture the PayPal order
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const captureData = await response.json();

        if (!response.ok) {
            console.error('PayPal capture error:', captureData);
            return NextResponse.json(
                { error: 'Failed to capture PayPal payment', details: captureData },
                { status: response.status }
            );
        }

        // Update Supabase order with PayPal transaction ID and status
        if (supabaseOrderId) {
            const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'completed',
                    paypal_transaction_id: captureData.id,
                    payment_method: 'paypal',
                })
                .eq('id', supabaseOrderId);

            if (updateError) {
                console.error('Error updating order with PayPal details:', updateError);
            }
        }

        return NextResponse.json(captureData);
    } catch (error: any) {
        console.error('Error capturing PayPal payment:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}