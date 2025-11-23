// app/admin/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Pencil,
    Trash2,
    PlusCircle,
    Package,
    Image as ImageIcon,
    ArrowLeft,
} from 'lucide-react';

interface AdminProduct {
    id: string;
    name: string;
    price: number;
    compare_at_price?: number | null;
    images?: string[];
    category?: string;
    stock_quantity?: number | null;
    in_stock?: boolean;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/products');
            const data = await res.json();
            setProducts(data || []);
        } catch (e) {
            console.error('Fehler beim Laden der Produkte', e);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id: string) => {
        if (!confirm('Produkt wirklich löschen?')) return;
        try {
            await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            load();
        } catch (e) {
            console.error('Fehler beim Löschen des Produkts', e);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Back button */}
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Admin Bereich
                </Link>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 tracking-tight mb-2">
                            Produkte verwalten
                        </h1>
                        <p className="text-sm text-gray-500">
                            Übersicht aller Produkte mit Preis, Lagerbestand und Status.
                        </p>
                    </div>

                    <Link
                        href="/admin/products/create"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition shadow-sm"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Neues Produkt
                    </Link>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="bg-gray-50 p-6 border border-gray-200 rounded-3xl shadow-sm animate-pulse"
                            >
                                <div className="flex gap-6">
                                    <div className="w-32 h-32 bg-white rounded-xl border" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-5 bg-gray-200 rounded w-2/3" />
                                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        <div className="h-9 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && products.length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-10 text-center">
                        <Package className="w-10 h-10 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-lg font-medium text-gray-900 mb-2">
                            Noch keine Produkte vorhanden
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Legen Sie Ihr erstes Produkt an, um den Shop zu füllen.
                        </p>
                        <Link
                            href="/admin/products/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Erstes Produkt anlegen
                        </Link>
                    </div>
                )}

                {/* Products grid */}
                {!loading && products.length > 0 && (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {products.map(p => {
                            const hasDiscount =
                                p.compare_at_price &&
                                p.compare_at_price > p.price;

                            return (
                                <div
                                    key={p.id}
                                    className="bg-gray-50 p-6 border border-gray-200 rounded-3xl hover:bg-white hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        {/* Image preview */}
                                        <div className="w-full sm:w-32 h-48 sm:h-32 bg-white rounded-xl border overflow-hidden flex items-center justify-center">
                                            {p.images?.[0] ? (
                                                <img
                                                    src={p.images[0]}
                                                    alt={p.name}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h2 className="text-lg font-medium text-gray-900">
                                                        {p.name}
                                                    </h2>
                                                    {p.category && (
                                                        <p className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                            {p.category}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Status badge */}
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.in_stock
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        : 'bg-red-50 text-red-700 border border-red-100'
                                                        }`}
                                                >
                                                    {p.in_stock
                                                        ? 'Aktiv'
                                                        : 'Inaktiv'}
                                                </span>
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-center gap-3">
                                                <span className="text-base font-medium text-gray-900">
                                                    {p.price.toFixed(2)} €
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {p.compare_at_price?.toFixed(
                                                            2
                                                        )}{' '}
                                                        €
                                                    </span>
                                                )}
                                            </div>

                                            {/* Stock */}
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Package className="w-4 h-4 text-gray-500" />
                                                <span>
                                                    Lager:{' '}
                                                    <span className="font-medium text-gray-800">
                                                        {p.stock_quantity ?? 0} Stk
                                                    </span>
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-3 pt-2">
                                                <Link
                                                    href={`/admin/products/${p.id}/edit`}
                                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition text-sm"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    Bearbeiten
                                                </Link>

                                                <button
                                                    onClick={() => remove(p.id)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition text-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Löschen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
