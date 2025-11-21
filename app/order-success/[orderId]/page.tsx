// app/order-success/[orderId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Mail, Home, ShoppingBag } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    total_amount: string;      // numeric из Supabase приходит как string
    delivery_method: 'delivery' | 'pickup';
    payment_method: 'card' | 'cash';
    created_at: string;
}

export default function OrderSuccessPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                const orderData = await res.json();

                if (!res.ok) {
                    console.error('Error loading order:', orderData);
                } else {
                    setOrder(orderData);
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="pt-24 pb-16">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full mx-auto" />
                        <p className="mt-4 text-gray-600">Lade Bestelldetails...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="pt-24 pb-16">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <h1 className="text-3xl font-serif text-gray-900 mb-4">
                            Bestellung nicht gefunden
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Die gesuchte Bestellung konnte nicht gefunden werden.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
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

    const totalNumber = Number(order.total_amount ?? 0);

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-3xl mx-auto px-6">
                    {/* Спасибо за заказ */}
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                            Vielen Dank für Ihre Bestellung!
                        </h1>
                        <p className="text-lg text-gray-600">
                            Ihre Bestellung wurde erfolgreich aufgegeben.
                        </p>
                    </div>

                    {/* Краткие детали */}
                    <div className="bg-gray-50 rounded-2xl p-8 mb-8">
                        <h2 className="text-xl font-serif text-gray-900 mb-6">
                            Bestelldetails
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Bestellnummer</p>
                                <p className="text-lg font-mono text-gray-900">
                                    #{order.id.substring(0, 8).toUpperCase()}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Datum</p>
                                <p className="text-lg text-gray-900">
                                    {new Date(order.created_at).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Gesamtbetrag</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {totalNumber.toFixed(2)} €
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Liefermethode</p>
                                <p className="text-lg text-gray-900">
                                    {order.delivery_method === 'delivery'
                                        ? 'Lieferung'
                                        : 'Abholung im Salon'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Что дальше */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
                        <h2 className="text-2xl font-serif text-gray-900 mb-6">
                            Wie geht es weiter?
                        </h2>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">
                                        Bestätigungs-E-Mail
                                    </h3>
                                    <p className="text-gray-600">
                                        Sie erhalten in Kürze eine Bestätigungs-E-Mail an{' '}
                                        <span className="font-medium">{order.customer_email}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">
                                        {order.delivery_method === 'delivery'
                                            ? 'Versandbestätigung'
                                            : 'Abholbenachrichtigung'}
                                    </h3>
                                    <p className="text-gray-600">
                                        {order.delivery_method === 'delivery'
                                            ? 'Sobald Ihre Bestellung versandt wurde, erhalten Sie eine E-Mail mit der Tracking-Nummer.'
                                            : 'Wir benachrichtigen Sie, sobald Ihre Bestellung zur Abholung bereit ist.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Кнопки */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <Link
                            href="/catalog"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Weiter einkaufen
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            Zur Startseite
                        </Link>
                    </div>

                    {/* ВАЖНО: ссылка на детальную страницу из профиля */}
                    <div className="text-center">
                        <Link
                            href={`/profile/orders/${order.id}`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm text-rose-600 hover:text-rose-700 font-medium"
                        >
                            Bestelldetails anzeigen
                        </Link>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-2">
                            Haben Sie Fragen zu Ihrer Bestellung?
                        </p>
                        <a
                            href="mailto:info@beauty-salon.de"
                            className="text-rose-600 hover:text-rose-700 font-medium"
                        >
                            Kontaktieren Sie uns
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
