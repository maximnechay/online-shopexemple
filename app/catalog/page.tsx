// app/catalog/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Filter, Sparkles } from 'lucide-react';
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

            const response = await fetch(`/api/products?${params}`);

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
        ? products.filter(p => p.inStock)
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
            case 'popular':
                return (b.reviewCount || 0) - (a.reviewCount || 0);
            case 'newest':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
            <Header />

            <main className="pt-28 pb-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-12 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-50 rounded-full border border-primary-200/50 mb-6">
                            <Sparkles className="w-4 h-4 text-primary-600" />
                            <span className="text-sm text-primary-900 font-semibold">Entdecken Sie</span>
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-serif text-neutral-900 mb-4 text-balance">
                            Produktkatalog
                        </h1>
                        <p className="text-xl text-neutral-600 font-light max-w-2xl">
                            Entdecken Sie unsere exklusive Auswahl an Premium-Kosmetik
                        </p>
                    </div>

                    {/* Categories */}
                    <div className="mb-10 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-3 pb-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                                    selectedCategory === 'all'
                                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-glow'
                                        : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200 shadow-soft'
                                }`}
                            >
                                Alle Produkte
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                                        selectedCategory === category.id
                                            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-glow'
                                            : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200 shadow-soft'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters & Sort Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 p-6 bg-white rounded-2xl shadow-soft border border-neutral-100">
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    className="w-5 h-5 text-primary-600 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all"
                                />
                                <span className="text-sm text-neutral-700 font-medium group-hover:text-primary-600 transition-colors">
                                    Nur verfügbare
                                </span>
                            </label>

                            <div className="h-6 w-px bg-neutral-200" />

                            <span className="text-sm text-neutral-600 font-semibold">
                                {sortedProducts.length} <span className="text-neutral-500 font-normal">{sortedProducts.length === 1 ? 'Produkt' : 'Produkte'}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-sm text-neutral-600 font-medium hidden sm:block">Sortieren:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="flex-1 sm:flex-none px-4 py-2.5 border border-neutral-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-neutral-400 transition-all cursor-pointer"
                            >
                                <option value="newest">Neueste</option>
                                <option value="popular">Beliebteste</option>
                                <option value="price-asc">Preis: Niedrig → Hoch</option>
                                <option value="price-desc">Preis: Hoch → Niedrig</option>
                                <option value="name-asc">Name: A → Z</option>
                                <option value="name-desc">Name: Z → A</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-square bg-gray-200 rounded-2xl mb-4" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <p className="text-gray-600 mb-4">
                                Fehler beim Laden der Produkte.
                            </p>
                            <button
                                onClick={fetchProducts}
                                className="px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
                            >
                                Erneut versuchen
                            </button>
                        </div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-lg text-gray-600">
                                Keine Produkte in dieser Kategorie gefunden.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {sortedProducts.map((product) => (
                                <ProductCard key={product.id} product={product as any} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}