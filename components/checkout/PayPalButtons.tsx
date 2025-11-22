// components/checkout/PayPalButtons.tsx
'use client';

import { PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PayPalButtonsWrapperProps {
    amount: number;
    onSuccess: (orderId: string, paypalTransactionId: string) => void;
    onError?: () => void;
    supabaseOrderId?: string;
}

export default function PayPalButtonsWrapper({
    amount,
    onSuccess,
    onError,
    supabaseOrderId,
}: PayPalButtonsWrapperProps) {
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    return (
        <div className="w-full">
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <PayPalButtons
                style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'pay',
                }}
                createOrder={async () => {
                    try {
                        const response = await fetch('/api/paypal/create-order', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ amount }),
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.error || 'Failed to create order');
                        }

                        return data.id;
                    } catch (err: any) {
                        setError(err.message || 'Fehler beim Erstellen der Bestellung');
                        throw err;
                    }
                }}
                onApprove={async (data) => {
                    try {
                        const response = await fetch('/api/paypal/capture-order', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                orderID: data.orderID,
                                supabaseOrderId,
                            }),
                        });

                        const captureData = await response.json();

                        if (!response.ok) {
                            throw new Error(captureData.error || 'Failed to capture payment');
                        }

                        // Call success callback
                        onSuccess(data.orderID, captureData.id);
                    } catch (err: any) {
                        setError(err.message || 'Fehler bei der Zahlungsabwicklung');
                        if (onError) onError();
                    }
                }}
                onError={(err) => {
                    console.error('PayPal Error:', err);
                    setError('Ein Fehler ist bei PayPal aufgetreten');
                    if (onError) onError();
                }}
            />
        </div>
    );
}