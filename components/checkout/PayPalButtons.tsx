// components/checkout/PayPalButtons.tsx
'use client';

import { PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api/client';

interface PayPalButtonsWrapperProps {
    items: any[];
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    deliveryMethod: 'delivery' | 'pickup';
    address?: {
        street: string;
        houseNumber: string;
        city: string;
        postalCode: string;
    } | null;
    userId?: string;
    discount?: number;
    couponCode?: string;
    onSuccess: (supabaseOrderId: string, paypalTransactionId: string) => void;
    onError?: () => void;
}

export default function PayPalButtonsWrapper({
    items,
    customer,
    deliveryMethod,
    address,
    userId,
    discount,
    couponCode,
    onSuccess,
    onError,
}: PayPalButtonsWrapperProps) {
    const [error, setError] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
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
                        // Создаём PayPal order БЕЗ создания в БД
                        const data = await apiPost('/api/paypal/create-order', {
                            items,
                            customer,
                            deliveryMethod,
                            address,
                            userId,
                            discount,
                            couponCode,
                        });

                        // Сохраняем ID заказа для использования в onApprove
                        if (data.orderId) {
                            setOrderId(data.orderId);
                        }

                        return data.id; // PayPal order ID
                    } catch (err: any) {
                        setError(err.message || 'Fehler beim Erstellen der Bestellung');
                        throw err;
                    }
                }}
                onApprove={async (data) => {
                    try {
                        // Захватываем платёж и СОЗДАЁМ заказ в БД
                        const captureData = await apiPost('/api/paypal/capture-order', {
                            orderID: data.orderID,
                        });

                        // Вызываем onSuccess с ID заказа
                        if (onSuccess && captureData.supabaseOrderId) {
                            onSuccess(captureData.supabaseOrderId, captureData.id);
                        }

                        // Перенаправляем на страницу успеха с order_id
                        router.push(`/order-success?order_id=${captureData.supabaseOrderId}`);
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
                    // НЕ показываем ошибку при отмене - это нормально
                    router.push('/checkout?canceled=1');
                }}
            />
        </div>
    );
}