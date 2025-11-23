// app/profile/orders/[orderId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    User,
    Package,
    Calendar,
    Truck,
    Home,
    ArrowLeft,
    CreditCard,
    MapPin,
    ShoppingBag,
    CheckCircle,
    Clock,
    XCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';

interface OrderItem {
    productId: string;
    productName: string;
    productPrice: number;
    quantity: number;
}

interface Order {
    id: string;
    user_id: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    delivery_address: string;
    delivery_city: string;
    delivery_postal_code: string;
    delivery_method: 'delivery' | 'pickup';
    payment_method: 'card' | 'cash' | 'paypal';
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    total_amount: string;
    status: string;
    notes: string | null;
    created_at: string;
    items: OrderItem[] | null;
}

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading } = useAuth();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
            return;
        }
    }, [user, loading, router]);

    useEffect(() => {
        const loadOrder = async () => {
            try {
                // ✅ ИСПРАВЛЕНО: Добавлен no-cache
                const res = await fetch(`/api/orders/${orderId}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                    },
                });

                if (!res.ok) {
                    throw new Error('Order not found');
                }
                const data: Order = await res.json();
                console.log('📦 Loaded order details:', data);
                setOrder(data);
            } catch (err) {
                console.error('Error loading order:', err);
                setOrder(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    const getStatusLabel = (status: string) => {
        const map: { [key: string]: string } = {
            pending: 'In Bearbeitung',
            processing: 'Wird vorbereitet',
            shipped: 'Versendet',
            delivered: 'Zugestellt',
            cancelled: 'Storniert',
        };
        return map[status] || status;
    };

    const getStatusClass = (status: string) => {
        const map: { [key: string]: string } = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusInfo = (paymentStatus: string) => {
        const statusMap: {
            [key: string]: {
                label: string;
                icon: typeof CheckCircle;
                color: string;
            };
        } = {
            completed: {
                label: 'Bezahlt',
                icon: CheckCircle,
                color: 'text-green-600',
            },
            pending: {
                label: 'Ausstehend',
                icon: Clock,
                color: 'text-yellow-600',
            },
            failed: {
                label: 'Fehlgeschlagen',
                icon: XCircle,
                color: 'text-red-600',
            },
            refunded: {
                label: 'Zurückerstattet',
                icon: ArrowLeft,
                color: 'text-blue-600',
            },
        };

        return (
            statusMap[paymentStatus] || {
                label: 'Unbekannt',
                icon: Clock,
                color: 'text-gray-600',
            }
        );
    };

    const getPaymentMethodLabel = (method: string) => {
        const methodMap: { [key: string]: string } = {
            card: 'Kreditkarte',
            paypal: 'PayPal',
            cash: 'Barzahlung',
        };

        return methodMap[method] || method;
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <main className="flex-1 pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center py-16">
                            <div className="animate-spin w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-gray-600">Lädt...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <main className="flex-1 pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h1 className="text-3xl font-serif text-gray-900 mb-4">
                            Bestellung nicht gefunden
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Die gesuchte Bestellung konnte nicht gefunden werden.
                        </p>
                        <Link
                            href="/profile/orders"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Zurück zu meinen Bestellungen
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const totalNumber = Number(order.total_amount ?? 0);
    const items = order.items || [];
    const paymentStatusInfo = getPaymentStatusInfo(order.payment_status);
    const PaymentIcon = paymentStatusInfo.icon;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    {/* Back */}
                    <button
                        type="button"
                        onClick={() => router.push('/profile/orders')}
                        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zurück zu meinen Bestellungen
                    </button>

                    <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-4">
                        Bestellung #{order.id.slice(0, 8).toUpperCase()}
                    </h1>

                    <div className="flex items-center gap-3 mb-8">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                order.status
                            )}`}
                        >
                            {getStatusLabel(order.status)}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.created_at).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            })}
                        </div>
                    </div>

                    {/* Overview cards */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-xs text-gray-500 mb-1">Gesamtbetrag</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {formatPrice(totalNumber)}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-xs text-gray-500 mb-1">Zahlungsstatus</p>
                            <div className="flex items-center gap-2">
                                <PaymentIcon className={`w-4 h-4 ${paymentStatusInfo.color}`} />
                                <p className={`text-sm font-medium ${paymentStatusInfo.color}`}>
                                    {paymentStatusInfo.label}
                                </p>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                {getPaymentMethodLabel(order.payment_method)}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-xs text-gray-500 mb-1">Liefermethode</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                {order.delivery_method === 'pickup' ? 'Abholung im Salon' : 'Lieferung'}
                            </p>
                        </div>
                    </div>

                    {/* Customer and address */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <User className="w-5 h-5 text-rose-600" />
                                <h2 className="text-lg font-medium text-gray-900">
                                    Kundendaten
                                </h2>
                            </div>
                            <p className="text-sm text-gray-900 mb-1">{order.customer_name}</p>
                            <p className="text-sm text-gray-600 mb-1">
                                {order.customer_email}
                            </p>
                            <p className="text-sm text-gray-600">
                                {order.customer_phone}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="w-5 h-5 text-rose-600" />
                                <h2 className="text-lg font-medium text-gray-900">
                                    Lieferadresse
                                </h2>
                            </div>
                            {order.delivery_method === 'pickup' ? (
                                <>
                                    <p className="text-sm text-gray-900 mb-1">
                                        Abholung im Salon
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Beautysalon Harmonie, Hannover
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-900 mb-1">
                                        {order.delivery_address}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {order.delivery_postal_code} {order.delivery_city}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <ShoppingBag className="w-5 h-5 text-rose-600" />
                            <h2 className="text-lg font-medium text-gray-900">
                                Bestellte Artikel
                            </h2>
                        </div>

                        {items.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                Keine Artikel gefunden.
                            </p>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {items.map((item, index) => (
                                    <div
                                        key={`${item.productId}-${index}`}
                                        className="py-3 flex items-center justify-between gap-4"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.productName}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {item.quantity} x {formatPrice(item.productPrice)}
                                            </p>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {formatPrice(item.productPrice * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
                            <span className="text-sm text-gray-600">
                                Gesamt
                            </span>
                            <span className="text-lg font-semibold text-gray-900">
                                {formatPrice(totalNumber)}
                            </span>
                        </div>
                    </div>

                    {/* Notes if any */}
                    {order.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Notizen</h3>
                            <p className="text-sm text-gray-700">{order.notes}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/catalog"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Weiter einkaufen
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            Zur Startseite
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}