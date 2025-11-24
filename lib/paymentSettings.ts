// lib/paymentSettings.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface PaymentSettings {
    id: number;
    mode: 'test' | 'live';
    currency: string;
    vat_rate: number;
    stripe_enabled: boolean;
    paypal_enabled: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Get payment settings from database
 * Used to determine which API keys to use (test vs live)
 */
export async function getPaymentSettings(): Promise<PaymentSettings> {
    const { data, error } = await supabaseAdmin
        .from('payment_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.error('Error fetching payment settings:', error);
        // Return defaults if error
        return {
            id: 1,
            mode: 'test',
            currency: 'EUR',
            vat_rate: 19,
            stripe_enabled: true,
            paypal_enabled: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    return data;
}

/**
 * Get Stripe secret key based on current mode (test/live)
 */
export async function getStripeSecretKey(): Promise<string> {
    const settings = await getPaymentSettings();

    const isTest = settings.mode === 'test';

    const secretKey = isTest
        ? process.env.STRIPE_SECRET_KEY_TEST
        : process.env.STRIPE_SECRET_KEY_LIVE;

    if (!secretKey) {
        throw new Error(`Stripe ${isTest ? 'test' : 'live'} secret key is not configured`);
    }

    return secretKey;
}

/**
 * Get Stripe publishable key based on current mode (test/live)
 * For use on frontend
 */
export async function getStripePublishableKey(): Promise<string> {
    const settings = await getPaymentSettings();

    const isTest = settings.mode === 'test';

    const publishableKey = isTest
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
        : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE;

    if (!publishableKey) {
        throw new Error(`Stripe ${isTest ? 'test' : 'live'} publishable key is not configured`);
    }

    return publishableKey;
}

/**
 * Check if Stripe is enabled and configured
 */
export async function isStripeEnabled(): Promise<boolean> {
    const settings = await getPaymentSettings();
    return settings.stripe_enabled;
}

/**
 * Check if PayPal is enabled and configured
 */
export async function isPayPalEnabled(): Promise<boolean> {
    const settings = await getPaymentSettings();
    return settings.paypal_enabled;
}

/**
 * Get PayPal client ID based on current mode (test/live)
 */
export async function getPayPalClientId(): Promise<string> {
    const settings = await getPaymentSettings();

    const isTest = settings.mode === 'test';

    const clientId = isTest
        ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_TEST
        : process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE;

    if (!clientId) {
        throw new Error(`PayPal ${isTest ? 'test' : 'live'} client ID is not configured`);
    }

    return clientId;
}

/**
 * Get PayPal client secret based on current mode (test/live)
 */
export async function getPayPalClientSecret(): Promise<string> {
    const settings = await getPaymentSettings();

    const isTest = settings.mode === 'test';

    const clientSecret = isTest
        ? process.env.PAYPAL_CLIENT_SECRET_TEST
        : process.env.PAYPAL_CLIENT_SECRET_LIVE;

    if (!clientSecret) {
        throw new Error(`PayPal ${isTest ? 'test' : 'live'} client secret is not configured`);
    }

    return clientSecret;
}

/**
 * Get PayPal API base URL based on current mode (test/live)
 */
export async function getPayPalApiUrl(): Promise<string> {
    const settings = await getPaymentSettings();

    return settings.mode === 'test'
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';
}
