// app/profile/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Calendar, ChevronRight, Truck } from 'lucide-react';
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
    payment_method: 'card' | 'cash';
    total_amount: string; // из Supabase приходит numeric как string
    status: string;       // 'pending' и тд
    notes: string | null;
    created_at: string;
    items: OrderItem[] | null;
}

export default function OrdersPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
            return;
        }

        if (user) {
            loadOrders(user.id);
        }
    }, [user, loading, router]);

    const loadOrders = async (userId: string) => {
        try {
            const response = await fetch(`/api/orders/user/${userId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            const data: Order[] = await response.json();
            setOrders(data || []);
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
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
        // можно усложнить логику позже, пока так:
        if (order.payment_method === 'card') return 'Bezahlt';
        if (order.status === 'cancelled') return 'Storniert';
        return 'Ausstehend';
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center py-16">
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

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
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
                                        const totalNumber = Number(order.total_amount ?? 0);

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
                                                        <p className="font-medium text-gray-900">
                                                            {getPaymentStatusLabel(order)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/order-success/${order.id}`}
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
