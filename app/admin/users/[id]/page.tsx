// app/admin/users/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    ShoppingCart,
    Package,
    BellRing,
    BellOff,
    MapPin,
    CreditCard,
    TrendingUp,
    Clock,
    RefreshCw,
} from 'lucide-react';

interface UserDetails {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    newsletter_enabled: boolean;
    created_at: string;
    role: string;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
    country?: string | null;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    payment_method: string;
    shipping_address: string;
    items_count: number;
}

interface Stats {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    last_order_date: string | null;
    first_order_date: string | null;
}

export default function UserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<UserDetails | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setOrders(data.orders || []);
                setStats(data.stats);
            } else {
                console.error('Failed to load user data');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            loadUserData();
        }
    }, [userId]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            pending: 'Ausstehend',
            processing: 'In Bearbeitung',
            completed: 'Abgeschlossen',
            delivered: 'Geliefert',
            cancelled: 'Storniert',
        };
        return labels[status.toLowerCase()] || status;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Lade Benutzerdaten...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Benutzer nicht gefunden</h1>
                    <Link
                        href="/admin/users"
                        className="text-rose-600 hover:text-rose-700"
                    >
                        Zurück zur Benutzerliste
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zur Benutzerliste
                    </Link>

                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                                {(user.full_name || user.email)[0].toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">
                                    {user.full_name || 'Unbekannter Benutzer'}
                                </h1>
                                <p className="text-gray-600">{user.email}</p>
                                {user.role === 'admin' && (
                                    <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                        Administrator
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={loadUserData}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Aktualisieren"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.total_orders}</div>
                                    <div className="text-sm text-gray-600">Bestellungen</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.total_spent.toFixed(2)}€</div>
                                    <div className="text-sm text-gray-600">Gesamt ausgegeben</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.average_order_value.toFixed(2)}€</div>
                                    <div className="text-sm text-gray-600">Durchschnittlicher Wert</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {stats.last_order_date
                                            ? new Date(stats.last_order_date).toLocaleDateString('de-DE')
                                            : 'Keine'}
                                    </div>
                                    <div className="text-sm text-gray-600">Letzte Bestellung</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-900">Benutzerinformationen</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-600">E-Mail</div>
                                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                    </div>
                                </div>

                                {user.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-600">Telefon</div>
                                            <div className="text-sm font-medium text-gray-900">{user.phone}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-600">Registriert</div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(user.created_at).toLocaleDateString('de-DE', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            vor {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} Tagen
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    {user.newsletter_enabled ? (
                                        <BellRing className="w-5 h-5 text-green-500 mt-0.5" />
                                    ) : (
                                        <BellOff className="w-5 h-5 text-gray-400 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-600">Newsletter</div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.newsletter_enabled ? 'Abonniert' : 'Nicht abonniert'}
                                        </div>
                                    </div>
                                </div>

                                {(user.address || user.city) && (
                                    <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-600 mb-1">Adresse</div>
                                            {user.address && (
                                                <div className="text-sm font-medium text-gray-900">{user.address}</div>
                                            )}
                                            {(user.postal_code || user.city) && (
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.postal_code} {user.city}
                                                </div>
                                            )}
                                            {user.country && (
                                                <div className="text-sm text-gray-600">{user.country}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Orders History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Bestellhistorie</h2>
                                <span className="text-sm text-gray-600">{orders.length} Bestellung(en)</span>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {orders.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Keine Bestellungen
                                        </h3>
                                        <p className="text-gray-600">
                                            Dieser Benutzer hat noch keine Bestellungen aufgegeben
                                        </p>
                                    </div>
                                ) : (
                                    orders.map((order) => (
                                        <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <Link
                                                        href={`/admin/orders`}
                                                        className="text-base font-semibold text-gray-900 hover:text-rose-600 transition-colors"
                                                    >
                                                        #{order.order_number}
                                                    </Link>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {new Date(order.created_at).toLocaleDateString('de-DE', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {Number(order.total).toFixed(2)}€
                                                    </div>
                                                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Package className="w-4 h-4" />
                                                    <span>{order.items_count} Artikel</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <CreditCard className="w-4 h-4" />
                                                    <span>{order.payment_method || 'N/A'}</span>
                                                </div>
                                            </div>
                                            {order.shipping_address && (
                                                <div className="mt-2 text-sm text-gray-600 flex items-start gap-1">
                                                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-1">{order.shipping_address}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
