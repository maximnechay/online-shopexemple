// app/admin/product-variants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Link2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiPost } from '@/lib/api/client';

interface Product {
    id: string;
    name: string;
    slug: string;
    variant_group: string | null;
    variantValue?: string;
}

interface SuggestedGroup {
    products: Product[];
    variantAttribute: string;
    variantValues: string[];
    count: number;
}

const VARIANT_ATTRIBUTES = [
    { slug: 'volumen', label: 'Volumen' },
    { slug: 'lange', label: 'Länge' },
    { slug: 'gewicht', label: 'Gewicht' },
    { slug: 'farbe', label: 'Farbe' }
];

export default function ProductVariantsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>(['volumen', 'lange', 'gewicht']);
    const [loading, setLoading] = useState(true);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [linking, setLinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
        loadSuggestions();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data || []);
        } catch (e) {
            console.error('Error loading products', e);
            setError('Fehler beim Laden der Produkte');
        } finally {
            setLoading(false);
        }
    };

    const loadSuggestions = async () => {
        try {
            setLoadingSuggestions(true);
            const params = new URLSearchParams({
                variantAttributes: selectedAttributes.join(',')
            });
            const res = await fetch(`/api/admin/product-variants/suggest?${params}`);
            const data = await res.json();
            setSuggestedGroups(data.suggestedGroups || []);
        } catch (e) {
            console.error('Error loading suggestions', e);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const linkProducts = async (productIds?: string[]) => {
        const idsToLink = productIds || Array.from(selectedProducts);

        if (idsToLink.length < 2) {
            setError('Bitte wählen Sie mindestens 2 Produkte aus');
            return;
        }

        const variantGroup = crypto.randomUUID();

        try {
            setLinking(true);
            setError(null);
            setSuccess(null);

            await apiPost('/api/admin/product-variants/link', {
                productIds: idsToLink,
                variantGroup,
                variantAttributes: selectedAttributes
            });

            setSuccess(`${idsToLink.length} Produkte erfolgreich verknüpft!`);
            setSelectedProducts(new Set());

            // Reload data
            await Promise.all([loadProducts(), loadSuggestions()]);
        } catch (e: any) {
            console.error('Error linking products', e);
            setError(e.message || 'Fehler beim Verknüpfen der Produkte');
        } finally {
            setLinking(false);
        }
    };

    const linkSuggestedGroup = async (group: SuggestedGroup) => {
        const productIds = group.products.map(p => p.id);
        await linkProducts(productIds);
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

    const toggleAttribute = (slug: string) => {
        const newAttributes = selectedAttributes.includes(slug)
            ? selectedAttributes.filter(a => a !== slug)
            : [...selectedAttributes, slug];
        setSelectedAttributes(newAttributes);

        // Reload suggestions with new attributes
        if (newAttributes.length > 0) {
            setTimeout(loadSuggestions, 100);
        }
    };

    const groupedProducts = products.reduce((acc, product) => {
        const groupKey = product.variant_group || 'ungrouped';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    return (
        <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
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
                        Verknüpfen Sie zusammengehörige Produkte (z.B. verschiedene Längen/Volumina)
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-900">Fehler</p>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-green-900">Erfolg</p>
                            <p className="text-sm text-green-700 mt-1">{success}</p>
                        </div>
                    </div>
                )}

                {/* Attribute Selector */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Varianten-Attribute auswählen
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Wählen Sie die Attribute aus, nach denen Varianten gruppiert werden sollen
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {VARIANT_ATTRIBUTES.map(attr => (
                            <button
                                key={attr.slug}
                                onClick={() => toggleAttribute(attr.slug)}
                                className={`
                                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                                    ${selectedAttributes.includes(attr.slug)
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {attr.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Auto-Suggested Groups */}
                {suggestedGroups.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-sm border border-purple-200 p-6 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">
                                    Automatische Vorschläge
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {suggestedGroups.length} Gruppen gefunden, die automatisch verknüpft werden können
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {suggestedGroups.map((group, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl p-4 border border-gray-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Gruppe {idx + 1}: {group.count} Produkte
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Variiert nach: <span className="font-medium">{group.variantAttribute}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => linkSuggestedGroup(group)}
                                            disabled={linking}
                                            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Verknüpfen
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.products.map(product => (
                                            <div
                                                key={product.id}
                                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs"
                                            >
                                                <span className="font-medium">{product.variantValue}</span>
                                                <span className="text-gray-500 ml-1">- {product.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manual Selection Panel */}
                {selectedProducts.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-900">
                                    {selectedProducts.size} Produkte manuell ausgewählt
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Diese Produkte werden als Varianten verknüpft
                                </p>
                            </div>
                            <button
                                onClick={() => linkProducts()}
                                disabled={linking}
                                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Link2 className="w-4 h-4" />
                                Verknüpfen
                            </button>
                        </div>
                    </div>
                )}

                {/* Products List */}
                {loading || loadingSuggestions ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-sm text-gray-600">Laden...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Existing Groups */}
                        {Object.entries(groupedProducts)
                            .filter(([key]) => key !== 'ungrouped')
                            .map(([groupKey, groupProducts]) => (
                                <div key={groupKey} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                                        Verknüpfte Gruppe ({groupProducts.length} Produkte)
                                    </h2>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {groupProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className="p-4 border-2 border-green-200 rounded-xl bg-green-50"
                                            >
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{product.slug}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                        {/* Ungrouped Products */}
                        {groupedProducts.ungrouped && groupedProducts.ungrouped.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
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
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{product.slug}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}