// app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users,
    Mail,
    Calendar,
    ShoppingCart,
    BellRing,
    BellOff,
    Search,
    RefreshCw,
    ArrowLeft,
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    newsletter_enabled: boolean;
    created_at: string;
    order_count?: number;
    total_spent?: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            } else {
                console.error('Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: users.length,
        newsletter: users.filter(u => u.newsletter_enabled).length,
        withOrders: users.filter(u => (u.order_count || 0) > 0).length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Lade Benutzer...</span>
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
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zum Dashboard
                    </Link>

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">
                                Benutzer
                            </h1>
                            <p className="text-gray-600">
                                Registrierte Kunden und Newsletter-Abonnements
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                                    <div className="text-sm text-gray-600">Gesamt Benutzer</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <BellRing className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.newsletter}</div>
                                    <div className="text-sm text-gray-600">Newsletter-Abonnenten</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.withOrders}</div>
                                    <div className="text-sm text-gray-600">Mit Bestellungen</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Suche nach Name oder E-Mail..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={loadUsers}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Aktualisieren"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                {filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Keine Benutzer gefunden
                        </h3>
                        <p className="text-gray-600">
                            {searchTerm
                                ? 'Versuchen Sie einen anderen Suchbegriff'
                                : 'Es gibt noch keine registrierten Benutzer'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Benutzer
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kontakt
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Newsletter
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bestellungen
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registriert
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {(user.full_name || user.email)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.full_name || 'Unbekannt'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {user.phone || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.newsletter_enabled ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <BellRing className="w-3 h-3" />
                                                        Aktiv
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        <BellOff className="w-3 h-3" />
                                                        Inaktiv
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {user.order_count || 0} Bestellung(en)
                                                </div>
                                                {user.total_spent && user.total_spent > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        {Number(user.total_spent).toFixed(2)} € gesamt
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(user.created_at).toLocaleDateString('de-DE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
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
