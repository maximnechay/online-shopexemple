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
    last_order_date?: string | null;
    average_order_value?: number;
    role?: string;
}

type SortField = 'created_at' | 'total_spent' | 'order_count' | 'last_order_date' | 'email';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'newsletter' | 'with-orders' | 'no-orders';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [filterType, setFilterType] = useState<FilterType>('all');

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

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const exportToCSV = () => {
        const headers = ['Email', 'Name', 'Telefon', 'Newsletter', 'Bestellungen', 'Gesamt ausgegeben', 'Registriert', 'Letzter Einkauf'];
        const rows = filteredAndSortedUsers.map(user => [
            user.email,
            user.full_name || '',
            user.phone || '',
            user.newsletter_enabled ? 'Ja' : 'Nein',
            user.order_count || 0,
            user.total_spent ? `${Number(user.total_spent).toFixed(2)}€` : '0€',
            new Date(user.created_at).toLocaleDateString('de-DE'),
            user.last_order_date ? new Date(user.last_order_date).toLocaleDateString('de-DE') : 'Nie'
        ]);

        const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `benutzer_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        switch (filterType) {
            case 'newsletter':
                return user.newsletter_enabled;
            case 'with-orders':
                return (user.order_count || 0) > 0;
            case 'no-orders':
                return (user.order_count || 0) === 0;
            default:
                return true;
        }
    });

    const filteredAndSortedUsers = [...filteredUsers].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
            case 'email':
                aValue = a.email.toLowerCase();
                bValue = b.email.toLowerCase();
                break;
            case 'total_spent':
                aValue = a.total_spent || 0;
                bValue = b.total_spent || 0;
                break;
            case 'order_count':
                aValue = a.order_count || 0;
                bValue = b.order_count || 0;
                break;
            case 'last_order_date':
                aValue = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
                bValue = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
                break;
            case 'created_at':
            default:
                aValue = new Date(a.created_at).getTime();
                bValue = new Date(b.created_at).getTime();
                break;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const stats = {
        total: users.length,
        newsletter: users.filter(u => u.newsletter_enabled).length,
        withOrders: users.filter(u => (u.order_count || 0) > 0).length,
        totalRevenue: users.reduce((sum, u) => sum + (u.total_spent || 0), 0),
        averageOrderValue: users.filter(u => (u.order_count || 0) > 0).length > 0
            ? users.reduce((sum, u) => sum + (u.average_order_value || 0), 0) / users.filter(u => (u.order_count || 0) > 0).length
            : 0,
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <span className="text-xl font-bold">€</span>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toFixed(0)}€</div>
                                    <div className="text-sm text-gray-600">Gesamtumsatz</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[200px] relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Suche nach Name oder E-Mail..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                >
                                    <option value="all">Alle Benutzer</option>
                                    <option value="newsletter">Newsletter-Abonnenten</option>
                                    <option value="with-orders">Mit Bestellungen</option>
                                    <option value="no-orders">Ohne Bestellungen</option>
                                </select>
                                <button
                                    onClick={exportToCSV}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    title="Exportieren"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    CSV
                                </button>
                                <button
                                    onClick={loadUsers}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Aktualisieren"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            Zeige {filteredAndSortedUsers.length} von {users.length} Benutzern
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                {filteredAndSortedUsers.length === 0 ? (
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
                                        <th
                                            onClick={() => handleSort('email')}
                                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                Benutzer
                                                {sortField === 'email' && (
                                                    <span className="text-rose-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kontakt
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Newsletter
                                        </th>
                                        <th
                                            onClick={() => handleSort('order_count')}
                                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                Bestellungen
                                                {sortField === 'order_count' && (
                                                    <span className="text-rose-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('total_spent')}
                                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                Gesamt
                                                {sortField === 'total_spent' && (
                                                    <span className="text-rose-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('last_order_date')}
                                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                Letzter Einkauf
                                                {sortField === 'last_order_date' && (
                                                    <span className="text-rose-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('created_at')}
                                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                Registriert
                                                {sortField === 'created_at' && (
                                                    <span className="text-rose-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredAndSortedUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 group">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {(user.full_name || user.email)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 group-hover:text-rose-600 transition-colors">
                                                            {user.full_name || 'Unbekannt'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </Link>
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
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                                                        {user.order_count || 0}
                                                    </span>
                                                    <span className="text-sm text-gray-600">Bestellung(en)</span>
                                                </div>
                                                {user.average_order_value && user.average_order_value > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Ø {Number(user.average_order_value).toFixed(2)} € pro Bestellung
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.total_spent ? `${Number(user.total_spent).toFixed(2)} €` : '0 €'}
                                                </div>
                                                {user.total_spent && user.total_spent > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        Umsatz
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.last_order_date ? (
                                                    <>
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(user.last_order_date).toLocaleDateString('de-DE', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            vor {Math.floor((Date.now() - new Date(user.last_order_date).getTime()) / (1000 * 60 * 60 * 24))} Tagen
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">Noch nie</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <div>
                                                    {new Date(user.created_at).toLocaleDateString('de-DE', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    vor {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} Tagen
                                                </div>
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
