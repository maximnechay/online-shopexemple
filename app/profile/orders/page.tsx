// app/profile/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Calendar, ChevronRight, Truck, RefreshCw } from 'lucide-react';

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
    order_number: string;
    user_id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    street: string;
    house_number: string;
    city: string;
    postal_code: string;
    delivery_method: 'delivery' | 'pickup';
    payment_method: 'card' | 'cash' | 'paypal';
    payment_status: 'pending' | 'completed' | 'paid' | 'failed' | 'refunded';
    subtotal: string;
    shipping: string;
    coupon_discount?: string | null;
    coupon_code?: string | null;
    total: string;
    status: string;
    notes: string | null;
    created_at: string;
    items: OrderItem[] | null;
}

export default function OrdersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
            return;
        }

        if (user) {
            loadOrders(user.id);
        }
    }, [user, authLoading, router]);

    const loadOrders = async (userId: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/orders/user/${userId}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
            });

            if (!response.ok) {
                throw new Error('Fehler beim Laden der Bestellungen');
            }

            const data = await response.json();
            console.log('📦 Loaded orders:', data);
            setOrders(data);
        } catch (err: any) {
            console.error('Load orders error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: { [key: string]: { label: string; color: string } } = {
            pending: { label: 'In Bearbeitung', color: 'bg-yellow-100 text-yellow-800' },
            processing: { label: 'Wird vorbereitet', color: 'bg-blue-100 text-blue-800' },
            shipped: { label: 'Versendet', color: 'bg-purple-100 text-purple-800' },
            delivered: { label: 'Zugestellt', color: 'bg-green-100 text-green-800' },
            cancelled: { label: 'Storniert', color: 'bg-red-100 text-red-800' },
        };

        const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getItemsCount = (order: Order) => {
        if (!order.items || !Array.isArray(order.items)) return 0;
        return order.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    };

    const getPaymentStatusLabel = (order: Order) => {
        // ✅ ИСПРАВЛЕНО: Используем payment_status из базы данных
        const paymentStatusMap: { [key: string]: string } = {
            'completed': 'Bezahlt',
            'pending': 'Ausstehend',
            'failed': 'Fehlgeschlagen',
            'refunded': 'Zurückerstattet',
        };

        return paymentStatusMap[order.payment_status] || 'Unbekannt';
    };

    const getPaymentMethodLabel = (method: string) => {
        const methodMap: { [key: string]: string } = {
            'card': 'Kreditkarte',
            'paypal': 'PayPal',
            'cash': 'Barzahlung',
        };

        return methodMap[method] || method;
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <main className="flex-1 pt-32 md:pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-6 lg:px-8">
                        {/* Title skeleton */}
                        <div className="h-12 bg-gray-200 rounded w-64 mb-8 animate-pulse" />

                        <div className="grid md:grid-cols-4 gap-8">
                            {/* Sidebar skeleton */}
                            <div className="md:col-span-1 space-y-2">
                                <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                                <div className="h-12 bg-rose-50 rounded-lg animate-pulse" />
                            </div>

                            {/* Orders skeleton */}
                            <div className="md:col-span-3 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-3 flex-1">
                                                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                                                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                                                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                                        </div>
                                        <div className="h-10 bg-rose-100 rounded-lg w-full animate-pulse" />
                                    </div>
                                ))}
                            </div>
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

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 pt-40 md:pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-8">
                        Meine Bestellungen
                    </h1>

                    <div className="grid md:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="md:col-span-1">
                            <nav className="space-y-2">
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                >
                                    <User className="w-5 h-5" />
                                    <span>Profildaten</span>
                                </Link>
                                <Link
                                    href="/profile/orders"
                                    className="flex items-center gap-3 px-4 py-3 bg-rose-50 text-rose-600 rounded-lg font-medium"
                                >
                                    <Package className="w-5 h-5" />
                                    <span>Bestellungen</span>
                                </Link>
                            </nav>
                        </div>

                        {/* Main Content */}
                        <div className="md:col-span-3">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            {orders.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Package className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h2 className="text-2xl font-serif text-gray-900 mb-2">
                                        Noch keine Bestellungen
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Sie haben noch keine Bestellungen aufgegeben.
                                    </p>
                                    <Link
                                        href="/catalog"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
                                    >
                                        Jetzt einkaufen
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => {
                                        const itemsCount = getItemsCount(order);
                                        const totalNumber = Number(order.total ?? 0);

                                        return (
                                            <div
                                                key={order.id}
                                                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                                                            Bestellung #{order.id.slice(0, 8).toUpperCase()}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(order.created_at).toLocaleDateString('de-DE', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                            })}
                                                        </div>
                                                    </div>
                                                    {getStatusBadge(order.status)}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Artikel</p>
                                                        <p className="font-medium text-gray-900">{itemsCount}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Gesamt</p>
                                                        <p className="font-medium text-gray-900">
                                                            {formatPrice(totalNumber)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Versand</p>
                                                        <p className="font-medium text-gray-900 flex items-center gap-1">
                                                            <Truck className="w-4 h-4" />
                                                            {order.delivery_method === 'pickup'
                                                                ? 'Abholung'
                                                                : 'Standard'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Zahlung</p>
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-gray-900">
                                                                {getPaymentStatusLabel(order)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {getPaymentMethodLabel(order.payment_method)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/profile/orders/${order.id}`}
                                                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Details anzeigen
                                                    </span>
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}