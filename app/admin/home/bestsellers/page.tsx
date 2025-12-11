'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Package, X, Search } from 'lucide-react';
import { apiPut } from '@/lib/api/client';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    brand?: string;
    homepage_position?: number | null;
}

export default function BestsellersPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const res = await fetch('/api/admin/products');
            const data = await res.json();
            // Фильтруем только родительские продукты (без parent_id)
            const parentProducts = (data || []).filter((p: any) => !p.parent_id);
            setProducts(parentProducts);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Получаем товары по позициям
    const getProductAtPosition = (position: number): Product | undefined => {
        return products.find(p => p.homepage_position === position);
    };

    // Получаем занятые позиции
    const getOccupiedPositions = (): number[] => {
        return products
            .filter(p => p.homepage_position)
            .map(p => p.homepage_position as number);
    };

    // Назначить товар на позицию
    const assignProduct = async (productId: string, position: number) => {
        setSaving(productId);
        try {
            await apiPut(`/api/admin/products/${productId}`, {
                homepage_position: position
            });

            setProducts(prev => prev.map(p => {
                // Убираем с этой позиции другой товар если был
                if (p.homepage_position === position && p.id !== productId) {
                    return { ...p, homepage_position: null };
                }
                // Назначаем новый товар
                if (p.id === productId) {
                    return { ...p, homepage_position: position };
                }
                return p;
            }));
        } catch (error) {
            console.error('Error assigning product:', error);
            alert('Fehler beim Speichern');
        } finally {
            setSaving(null);
        }
    };

    // Убрать товар с позиции
    const removeFromPosition = async (productId: string) => {
        setSaving(productId);
        try {
            await apiPut(`/api/admin/products/${productId}`, {
                homepage_position: null
            });

            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, homepage_position: null } : p
            ));
        } catch (error) {
            console.error('Error removing product:', error);
            alert('Fehler beim Entfernen');
        } finally {
            setSaving(null);
        }
    };

    // Фильтрованные товары для поиска (без уже назначенных)
    const availableProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
        const notAssigned = !p.homepage_position;
        return matchesSearch && notAssigned;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-4xl font-light text-gray-900 mb-2">Bestseller verwalten</h1>
                    <p className="text-gray-600">
                        Wähle bis zu 4 Produkte für die Startseite aus. Die Reihenfolge entspricht der Position.
                    </p>
                </div>

                {/* Позиции 1-4 */}
                <div className="mb-12">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Aktuelle Bestseller</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(position => {
                            const product = getProductAtPosition(position);

                            return (
                                <div
                                    key={position}
                                    className={`relative rounded-2xl border-2 ${product
                                            ? 'border-emerald-200 bg-emerald-50'
                                            : 'border-dashed border-gray-300 bg-gray-50'
                                        } p-4 min-h-[200px]`}
                                >
                                    <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                                        {position}
                                    </div>

                                    {product ? (
                                        <div className="pt-8">
                                            <div className="aspect-square rounded-xl bg-white mb-3 overflow-hidden relative">
                                                {product.images?.[0] ? (
                                                    <Image
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Package className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1">{product.brand || 'Marke'}</p>
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                                {product.name}
                                            </p>
                                            <p className="text-sm text-gray-600">{product.price.toFixed(2)} €</p>

                                            <button
                                                onClick={() => removeFromPosition(product.id)}
                                                disabled={saving === product.id}
                                                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-red-50 transition"
                                            >
                                                {saving === product.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                ) : (
                                                    <X className="w-4 h-4 text-red-500" />
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center pt-6">
                                            <p className="text-sm text-gray-400 text-center">
                                                Kein Produkt<br />ausgewählt
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Поиск и выбор товаров */}
                <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Produkt hinzufügen</h2>

                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Produkt suchen..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                        />
                    </div>

                    {availableProducts.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl">
                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">
                                {searchQuery
                                    ? 'Keine Produkte gefunden'
                                    : 'Alle Produkte sind bereits zugewiesen'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                            {availableProducts.slice(0, 30).map(product => {
                                const occupiedPositions = getOccupiedPositions();

                                return (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                                    >
                                        <div className="w-16 h-16 rounded-lg bg-white overflow-hidden relative flex-shrink-0">
                                            {product.images?.[0] ? (
                                                <Image
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-gray-300" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500">{product.brand || 'Marke'}</p>
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {product.name}
                                            </p>
                                            <p className="text-sm text-gray-600">{product.price.toFixed(2)} €</p>
                                        </div>

                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(pos => {
                                                const isOccupied = occupiedPositions.includes(pos);

                                                return (
                                                    <button
                                                        key={pos}
                                                        onClick={() => !isOccupied && assignProduct(product.id, pos)}
                                                        disabled={isOccupied || saving === product.id}
                                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${isOccupied
                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                : 'bg-white border border-gray-300 text-gray-700 hover:border-black hover:bg-black hover:text-white'
                                                            }`}
                                                        title={isOccupied ? 'Position belegt' : `Position ${pos}`}
                                                    >
                                                        {saving === product.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                                        ) : (
                                                            pos
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}