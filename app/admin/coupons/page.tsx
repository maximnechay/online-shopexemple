// app/admin/coupons/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Calendar, Users, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Coupon } from '@/lib/types';

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await fetch('/api/admin/coupons');
            if (response.ok) {
                const data = await response.json();
                setCoupons(data.coupons || []);
            }
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Gutschein löschen?')) return;

        try {
            const response = await fetch(`/api/admin/coupons/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setCoupons(coupons.filter((c) => c.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete coupon:', error);
            alert('Fehler beim Löschen des Gutscheins');
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingCoupon(null);
        setShowModal(true);
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            fixed: 'Fester Betrag',
            percentage: 'Prozent',
            free_shipping: 'Kostenloser Versand',
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            fixed: 'bg-blue-100 text-blue-800',
            percentage: 'bg-purple-100 text-purple-800',
            free_shipping: 'bg-green-100 text-green-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Кнопка назад */}
            <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Zurück zum Dashboard
            </Link>

            {/* Заголовок */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gutscheine & Rabattcodes</h1>
                    <p className="text-gray-600">Verwaltung von Rabatten und Gutscheincodes</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Gutschein erstellen</span>
                </button>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Gesamt Gutscheine</div>
                            <div className="text-2xl font-bold text-gray-900">{coupons.length}</div>
                        </div>
                        <Tag className="w-10 h-10 text-blue-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Aktiv</div>
                            <div className="text-2xl font-bold text-green-600">
                                {coupons.filter((c) => c.is_active).length}
                            </div>
                        </div>
                        <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Einlösungen</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {coupons.reduce((sum, c) => sum + c.uses_count, 0)}
                            </div>
                        </div>
                        <Users className="w-10 h-10 text-purple-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Ablaufend</div>
                            <div className="text-2xl font-bold text-orange-600">
                                {
                                    coupons.filter(
                                        (c) =>
                                            c.valid_until &&
                                            new Date(c.valid_until) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                    ).length
                                }
                            </div>
                        </div>
                        <Calendar className="w-10 h-10 text-orange-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Таблица купонов */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Typ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rabatt
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Eingelöst
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Gültigkeit
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aktionen
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {coupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                                <Tag className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-mono font-bold text-gray-900">
                                                    {coupon.code}
                                                </div>
                                                {coupon.description && (
                                                    <div className="text-xs text-gray-500">{coupon.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                                                coupon.type
                                            )}`}
                                        >
                                            {getTypeLabel(coupon.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {coupon.type === 'fixed'
                                                ? formatAmount(coupon.amount)
                                                : coupon.type === 'percentage'
                                                    ? `${coupon.amount}%`
                                                    : '-'}
                                        </div>
                                        {coupon.min_order_amount > 0 && (
                                            <div className="text-xs text-gray-500">
                                                Minimum: {formatAmount(coupon.min_order_amount)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {coupon.uses_count}
                                            {coupon.max_uses && ` / ${coupon.max_uses}`}
                                        </div>
                                        {coupon.per_user_limit && (
                                            <div className="text-xs text-gray-500">
                                                {coupon.per_user_limit}x pro Nutzer
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs text-gray-900">
                                            {coupon.valid_until ? (
                                                <>
                                                    Bis:{' '}
                                                    {new Date(coupon.valid_until).toLocaleDateString('de-DE', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                    })}
                                                </>
                                            ) : (
                                                'Unbegrenzt'
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {coupon.is_active ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Aktiv
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                Inaktiv
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleEdit(coupon)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                                title="Bearbeiten"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Löschen"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {coupons.length === 0 && (
                        <div className="text-center py-12">
                            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">Noch keine Gutscheine vorhanden</p>
                            <button
                                onClick={handleCreate}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Ersten Gutschein erstellen
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно создания/редактирования */}
            {showModal && (
                <CouponModal
                    coupon={editingCoupon}
                    onClose={() => {
                        setShowModal(false);
                        setEditingCoupon(null);
                    }}
                    onSave={() => {
                        setShowModal(false);
                        setEditingCoupon(null);
                        fetchCoupons();
                    }}
                />
            )}
        </div>
    );
}

// Компонент модального окна
function CouponModal({
    coupon,
    onClose,
    onSave,
}: {
    coupon: Coupon | null;
    onClose: () => void;
    onSave: () => void;
}) {
    const [formData, setFormData] = useState({
        code: coupon?.code || '',
        description: coupon?.description || '',
        type: coupon?.type || 'fixed',
        amount: coupon?.amount || 0,
        minOrderAmount: coupon?.min_order_amount || 0,
        maxDiscountAmount: coupon?.max_discount_amount || undefined,
        maxUses: coupon?.max_uses || undefined,
        perUserLimit: coupon?.per_user_limit || undefined,
        validFrom: coupon?.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : '',
        validUntil: coupon?.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : '',
        isActive: coupon?.is_active ?? true,
    });

    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons';
            const method = coupon ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSave();
            } else {
                const data = await response.json();
                alert(data.error || 'Fehler beim Speichern');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Fehler beim Speichern des Gutscheins');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {coupon ? 'Gutschein bearbeiten' : 'Gutschein erstellen'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Код купона */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gutscheincode *
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) =>
                                setFormData({ ...formData, code: e.target.value.toUpperCase() })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
                            placeholder="SUMMER2025"
                            required
                            disabled={!!coupon}
                        />
                    </div>

                    {/* Описание */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                            placeholder="Sommerausverkauf -20%"
                        />
                    </div>

                    {/* Тип и сумма */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Typ *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="fixed">Fester Betrag (€)</option>
                                <option value="percentage">Prozent (%)</option>
                                <option value="free_shipping">Kostenloser Versand</option>
                            </select>
                        </div>

                        {formData.type !== 'free_shipping' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {formData.type === 'percentage' ? 'Prozent' : 'Betrag (€)'} *
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min={0}
                                    step={0.01}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Условия */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mindestbestellwert (€)
                            </label>
                            <input
                                type="number"
                                value={formData.minOrderAmount}
                                onChange={(e) =>
                                    setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min={0}
                                step={0.01}
                            />
                        </div>

                        {formData.type === 'percentage' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max. Rabatt (€)
                                </label>
                                <input
                                    type="number"
                                    value={formData.maxDiscountAmount || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min={0}
                                    step={0.01}
                                    placeholder="Unbegrenzt"
                                />
                            </div>
                        )}
                    </div>

                    {/* Лимиты */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max. Einlösungen
                            </label>
                            <input
                                type="number"
                                value={formData.maxUses || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        maxUses: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min={1}
                                placeholder="Unbegrenzt"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Limit pro Nutzer
                            </label>
                            <input
                                type="number"
                                value={formData.perUserLimit || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        perUserLimit: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min={1}
                                placeholder="Unbegrenzt"
                            />
                        </div>
                    </div>

                    {/* Даты */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gültig ab
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.validFrom}
                                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gültig bis
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Активность */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                            Gutschein aktiv
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
                            disabled={saving}
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300"
                        >
                            {saving ? 'Speichern...' : coupon ? 'Speichern' : 'Erstellen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
