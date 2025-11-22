// components/providers/PayPalProvider.tsx
'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';

export default function PayPalProvider({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
        console.error('PayPal Client ID is missing');
        return <>{children}</>;
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId,
                currency: 'EUR',
                intent: 'capture',
            }}
        >
            {children}
        </PayPalScriptProvider>
    );
}