// app/admin/product-variants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Link2, Trash2 } from 'lucide-react';
import { apiPost } from '@/lib/api/client';

interface Product {
    id: string;
    name: string;
    slug: string;
    variant_group: string | null;
}

export default function ProductVariantsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data || []);
        } catch (e) {
            console.error('Error loading products', e);
        } finally {
            setLoading(false);
        }
    };

    const linkProducts = async () => {
        if (selectedProducts.size < 2) {
            alert('Bitte wählen Sie mindestens 2 Produkte aus');
            return;
        }

        const variantGroup = crypto.randomUUID();
        const productIds = Array.from(selectedProducts);

        try {
            await apiPost('/api/admin/product-variants/link', { productIds, variantGroup });
            alert('Produkte erfolgreich verknüpft!');
            setSelectedProducts(new Set());
            loadProducts();
        } catch (e) {
            console.error('Error linking products', e);
            alert('Fehler beim Verknüpfen der Produkte');
        }
    };

    const toggleProduct = (id: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    const groupedProducts = products.reduce((acc, product) => {
        const groupKey = product.variant_group || 'ungrouped';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Admin Bereich
                </Link>

                <div className="mb-10">
                    <h1 className="text-4xl lg:text-5xl font-light text-gray-900 tracking-tight mb-2">
                        Produktvarianten verwalten
                    </h1>
                    <p className="text-sm text-gray-500">
                        Verknüpfen Sie zusammengehörige Produkte (z.B. verschiedene Größen/Volumina).
                    </p>
                </div>

                {/* Selection Panel */}
                {selectedProducts.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-900">
                                    {selectedProducts.size} Produkte ausgewählt
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Diese Produkte werden als Varianten verknüpft
                                </p>
                            </div>
                            <button
                                onClick={linkProducts}
                                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition inline-flex items-center gap-2"
                            >
                                <Link2 className="w-4 h-4" />
                                Verknüpfen
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">Laden...</div>
                ) : (
                    <div className="space-y-8">
                        {/* Ungrouped Products */}
                        {groupedProducts.ungrouped && groupedProducts.ungrouped.length > 0 && (
                            <div>
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    Nicht verknüpfte Produkte ({groupedProducts.ungrouped.length})
                                </h2>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedProducts.ungrouped.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => toggleProduct(product.id)}
                                            className={`
                                                p-4 border-2 rounded-xl cursor-pointer transition-all
                                                ${selectedProducts.has(product.id)
                                                    ? 'border-black bg-gray-50'
                                                    : 'border-gray-200 hover:border-gray-400'
                                                }
                                            `}
                                        >
                                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1">{product.slug}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Grouped Products */}
                        {Object.entries(groupedProducts)
                            .filter(([key]) => key !== 'ungrouped')
                            .map(([groupId, products]) => (
                                <div key={groupId} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <Link2 className="w-5 h-5" />
                                        Variantengruppe ({products.length} Produkte)
                                    </h2>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {products.map((product) => (
                                            <div
                                                key={product.id}
                                                className="p-4 bg-white border border-gray-200 rounded-xl"
                                            >
                                                <h3 className="font-medium text-gray-900">{product.name}</h3>
                                                <p className="text-xs text-gray-500 mt-1">{product.slug}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
