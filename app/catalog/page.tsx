// app/catalog/page.tsx
'use client';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shop/ProductCard';
import { Product, ProductCategory, SortOption } from '@/lib/types';
import { categories } from '@/lib/data/products';

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [inStockOnly, setInStockOnly] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory]);

    const fetchProducts = async () => {
        setLoading(true);
        setError(false);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }

            // ✅ ИСПРАВЛЕНИЕ: Добавлены опции для отключения кеша
            const response = await fetch(`/api/products?${params}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    // Фильтруем товары
    const filteredProducts = inStockOnly
        ? products.filter((p) => p.inStock)
        : products;

    // Сортируем товары
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc':
                return a.price - b.price;
            case 'price-desc':
                return b.price - a.price;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'newest':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
                            <p className="mt-4 text-gray-600">Lädt Produkte...</p>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center py-20">
                            <p className="text-red-600">Fehler beim Laden der Produkte</p>
                            <button
                                onClick={fetchProducts}
                                className="mt-4 px-6 py-3 bg-black text-white hover:bg-gray-800"
                            >
                                Erneut versuchen
                            </button>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                            Katalog
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            Entdecken Sie unsere Premium-Auswahl an Kosmetikprodukten
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === 'all'
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Alle
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.id
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Sort & Filter Options */}
                        <div className="flex gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-4 py-2 text-sm border border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-gray-900"
                            >
                                <option value="newest">Neueste zuerst</option>
                                <option value="price-asc">Preis aufsteigend</option>
                                <option value="price-desc">Preis absteigend</option>
                                <option value="name-asc">Name A-Z</option>
                                <option value="name-desc">Name Z-A</option>
                            </select>

                            <button
                                onClick={() => setInStockOnly(!inStockOnly)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${inStockOnly
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                Nur verfügbar
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {sortedProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-600">Keine Produkte gefunden</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {sortedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}

                    {/* Results count */}
                    <div className="mt-12 text-center text-sm text-gray-500">
                        {sortedProducts.length} {sortedProducts.length === 1 ? 'Produkt' : 'Produkte'}{' '}
                        gefunden
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}