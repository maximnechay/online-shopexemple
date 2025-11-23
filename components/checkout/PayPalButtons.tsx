// components/checkout/PayPalButtons.tsx
'use client';

import { PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PayPalButtonsWrapperProps {
    supabaseOrderId: string; // Теперь обязательный параметр!
    onSuccess: (orderId: string, paypalTransactionId: string) => void;
    onError?: () => void;
}

export default function PayPalButtonsWrapper({
    supabaseOrderId,
    onSuccess,
    onError,
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
                        // 🔒 БЕЗОПАСНОСТЬ: Отправляем ID заказа из БД, а не сумму
                        const response = await fetch('/api/paypal/create-order', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                supabaseOrderId
                            }),
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.error || 'Failed to create order');
                        }

                        return data.id; // PayPal order ID
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
                onCancel={() => {
                    console.log('PayPal payment cancelled by user');
                    setError('Zahlung wurde abgebrochen');
                }}
            />
        </div>
    );
}