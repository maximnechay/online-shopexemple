// app/order-success/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Package, Mail, Home, ShoppingBag, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/useCartStore';
import { purchase } from '@/lib/analytics'; // ⭐ GA4 Purchase Event

interface Order {
    id: string;
    order_number: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    total: string;
    subtotal: string;
    shipping: string;
    delivery_method: 'delivery' | 'pickup';
    payment_method: 'card' | 'cash' | 'paypal';
    created_at: string;
    items?: Array<{
        id: string;
        product_id: string;
        product_name: string;
        product_price: number;
        quantity: number;
    }>;
}

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clearCart } = useCartStore();
    const sessionId = searchParams.get('session_id'); // Stripe
    const orderId = searchParams.get('order_id'); // PayPal (our DB order ID)

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const findOrder = async () => {
            if (!sessionId && !orderId) {
                setError('Keine Zahlungs-ID gefunden');
                setLoading(false);
                return;
            }

            try {
                // Даём время webhook/capture обработать платёж (максимум 10 секунд)
                let attempts = 0;
                const maxAttempts = 20; // 20 попыток по 500мс = 10 секунд

                while (attempts < maxAttempts) {
                    let res;

                    if (sessionId) {
                        // Stripe
                        res = await fetch(`/api/orders?session_id=${sessionId}`);
                    } else if (orderId) {
                        // PayPal - ищем по ID заказа
                        res = await fetch(`/api/orders?order_id=${orderId}`);
                    }

                    if (res && res.ok) {
                        const data = await res.json();
                        if (data.order) {
                            setOrder(data.order);
                            // ⭐⭐⭐ GOOGLE ANALYTICS PURCHASE EVENT ⭐⭐⭐
                            if (data.order.items && data.order.items.length > 0) {
                                // Проверяем consent перед отправкой
                                if (typeof window.gtag !== 'undefined') {
                                    console.log('🎯 GA4: Tracking purchase event', {
                                        orderId: data.order.id,
                                        value: data.order.total,
                                        items: data.order.items.length
                                    });

                                    purchase(
                                        data.order.id,
                                        data.order.items.map((item: any) => ({
                                            item_id: item.product_id || item.id,
                                            item_name: item.product_name,
                                            price: Number(item.product_price),
                                            quantity: Number(item.quantity),
                                        })),
                                        Number(data.order.total),
                                        Number(data.order.shipping || 0),
                                        0
                                    );
                                } else {
                                    console.log('ℹ️ GA4: Analytics disabled by user consent');
                                }
                            }

                            // Очищаем корзину только после подтверждения успешной оплаты
                            clearCart();
                            setLoading(false);
                            return;
                        }
                    }

                    // Ждём 500мс перед следующей попыткой
                    await new Promise(resolve => setTimeout(resolve, 500));
                    attempts++;
                }

                // Если после 10 секунд заказ не найден
                console.error('❌ Order not found after 20 attempts:', {
                    sessionId,
                    orderId,
                });
                setError('Bestellung wird verarbeitet. Bitte überprüfen Sie Ihre E-Mail.');
                setLoading(false);
            } catch (err) {
                console.error('Error finding order:', err);
                setError('Fehler beim Laden der Bestellung');
                setLoading(false);
            }
        };

        findOrder();
    }, [sessionId, orderId, clearCart]);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50">
                <Header />
                <main className="max-w-2xl mx-auto px-4 py-16">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <Loader2 className="w-16 h-16 text-stone-400 animate-spin mx-auto mb-4" />
                        <h1 className="text-2xl font-serif text-stone-900 mb-2">
                            Bestellung wird verarbeitet...
                        </h1>
                        <p className="text-stone-600">
                            Bitte warten Sie einen Moment
                        </p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-stone-50">
                <Header />
                <main className="max-w-2xl mx-auto px-4 py-16">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-amber-600" />
                        </div>
                        <h1 className="text-2xl font-serif text-stone-900 mb-2">
                            Zahlung erfolgreich
                        </h1>
                        <p className="text-stone-600 mb-6">
                            {error}
                        </p>
                        <p className="text-sm text-stone-500 mb-8">
                            Ihre Bestellung wurde erfolgreich bezahlt und wird gerade verarbeitet.
                            Sie erhalten in Kürze eine Bestätigungs-E-Mail mit allen Details.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            Zur Startseite
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!order) {
        return null;
    }

    return (
        <div className="min-h-screen bg-stone-50">
            <Header />

            <main className="max-w-2xl mx-auto px-4 py-16">
                {/* Success Header */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-serif text-stone-900 mb-2">
                        Vielen Dank für Ihre Bestellung!
                    </h1>
                    <p className="text-stone-600 text-lg">
                        Ihre Bestellung wurde erfolgreich aufgegeben
                    </p>
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <h2 className="text-xl font-serif text-stone-900 mb-4">Bestelldetails</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-stone-100">
                            <span className="text-stone-600">Bestellnummer:</span>
                            <span className="font-medium text-stone-900">#{order.order_number || order.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-stone-100">
                            <span className="text-stone-600">Name:</span>
                            <span className="font-medium text-stone-900">{order.first_name} {order.last_name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-stone-100">
                            <span className="text-stone-600">E-Mail:</span>
                            <span className="font-medium text-stone-900">{order.email}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-stone-100">
                            <span className="text-stone-600">Lieferung:</span>
                            <span className="font-medium text-stone-900">
                                {order.delivery_method === 'delivery' ? 'Lieferung' : 'Abholung'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-stone-600">Gesamtbetrag:</span>
                            <span className="font-bold text-stone-900 text-lg">
                                €{parseFloat(order.total || '0').toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6">
                    <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-stone-600" />
                        Was passiert als nächstes?
                    </h3>
                    <ul className="space-y-2 text-sm text-stone-600">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>Sie erhalten eine Bestätigungs-E-Mail an <strong>{order.email}</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-stone-400 mt-0.5">•</span>
                            <span>Wir bereiten Ihre Bestellung vor</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-stone-400 mt-0.5">•</span>
                            <span>
                                {order.delivery_method === 'delivery'
                                    ? 'Ihre Bestellung wird in Kürze versandt'
                                    : 'Sie können Ihre Bestellung im Salon abholen'
                                }
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/"
                        className="flex-1 flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Zur Startseite
                    </Link>
                    <Link
                        href="/catalog"
                        className="flex-1 flex items-center justify-center gap-2 bg-white text-stone-900 px-6 py-3 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Weiter einkaufen
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-stone-400 animate-spin mx-auto mb-4" />
                    <p className="text-stone-600">Wird geladen...</p>
                </div>
            </div>
        }>
            <OrderSuccessContent />
        </Suspense>
    );
}