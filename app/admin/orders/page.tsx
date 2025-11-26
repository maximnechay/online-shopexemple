// app/admin/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Package,
    Eye,
    Filter,
    Search,
    Calendar,
    Euro,
    User,
    Mail,
    Phone,
    Download,
    RefreshCw
} from 'lucide-react';

interface Order {
    id: string;
    order_number: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    street: string;
    house_number: string;
    city: string;
    postal_code: string;
    subtotal: string;
    shipping: string;
    total: string;
    delivery_method: 'delivery' | 'pickup';
    payment_method: 'card' | 'paypal' | 'cash';
    payment_status: 'pending' | 'completed' | 'paid' | 'failed' | 'refunded';
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
    updated_at: string;
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
    pending: 'Ausstehend',
    processing: 'In Bearbeitung',
    shipped: 'Versandt',
    delivered: 'Zugestellt',
    cancelled: 'Storniert',
};

const paymentStatusColors = {
    pending: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800',
};

const paymentStatusLabels = {
    pending: 'Ausstehend',
    completed: 'Bezahlt',
    paid: 'Bezahlt',
    failed: 'Fehlgeschlagen',
    refunded: 'Erstattet',
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const loadOrders = async () => {
        setLoading(true);
        try {
            // Добавляем timestamp для предотвращения кеширования
            const res = await fetch(`/api/admin/orders?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            } else {
                console.error('Failed to load orders');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();

        // Обновлять заказы при возвращении на страницу
        const handleFocus = () => {
            loadOrders();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'all' || order.status === filter;
        const matchesSearch =
            `${order.first_name} ${order.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.order_number || order.id.substring(0, 8)).toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Lade Bestellungen...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">
                                Bestellungen
                            </h1>
                            <p className="text-gray-600">
                                Verwalten Sie alle Kundenbestellungen
                            </p>
                        </div>
                        <Link
                            href="/admin"
                            className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Zurück zum Dashboard
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                            <div className="text-sm text-gray-600">Gesamt</div>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
                            <div className="text-sm text-yellow-700">Ausstehend</div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <div className="text-2xl font-bold text-blue-900">{stats.processing}</div>
                            <div className="text-sm text-blue-700">In Bearbeitung</div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                            <div className="text-2xl font-bold text-purple-900">{stats.shipped}</div>
                            <div className="text-sm text-purple-700">Versandt</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <div className="text-2xl font-bold text-green-900">{stats.delivered}</div>
                            <div className="text-sm text-green-700">Zugestellt</div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Suche nach Bestellnummer, Name oder E-Mail..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2 items-center">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            >
                                <option value="all">Alle Status</option>
                                <option value="pending">Ausstehend</option>
                                <option value="processing">In Bearbeitung</option>
                                <option value="shipped">Versandt</option>
                                <option value="delivered">Zugestellt</option>
                                <option value="cancelled">Storniert</option>
                            </select>
                            <button
                                onClick={loadOrders}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Aktualisieren"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Keine Bestellungen gefunden
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm || filter !== 'all'
                                ? 'Versuchen Sie einen anderen Filter oder Suchbegriff'
                                : 'Es gibt noch keine Bestellungen'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bestellung
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kunde
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Datum
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Betrag
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Zahlung
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aktionen
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono font-medium text-gray-900">
                                                    #{order.order_number || order.id.substring(0, 8).toUpperCase()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {order.payment_method === 'card' ? '💳 Karte' :
                                                        order.payment_method === 'paypal' ? '💳 PayPal' :
                                                            '💵 Bar'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.first_name} {order.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(order.created_at).toLocaleDateString('de-DE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                                <div className="text-xs text-gray-400">
                                                    {new Date(order.created_at).toLocaleTimeString('de-DE', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {Number(order.total).toFixed(2)} €
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[order.payment_status]
                                                    }`}>
                                                    {paymentStatusLabels[order.payment_status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]
                                                    }`}>
                                                    {statusLabels[order.status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-900 font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
