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
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4 tracking-tight">
                            Produktkatalog
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            Entdecken Sie unsere exklusive Auswahl an Premium-Kosmetik
                        </p>
                    </div>

                    {/* Categories */}
                    <div className="mb-10 overflow-x-auto">
                        <div className="flex gap-3 pb-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                                        ? 'bg-black text-white'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                Alle Produkte
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category.id
                                            ? 'bg-black text-white'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters & Sort Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                />
                                <span className="text-sm text-gray-700">Nur verfügbare</span>
                            </label>

                            <span className="text-sm text-gray-500">
                                {sortedProducts.length} {sortedProducts.length === 1 ? 'Produkt' : 'Produkte'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 hidden sm:block">Sortieren:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
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
                                    <div className="aspect-[4/5] bg-gray-100 rounded-3xl mb-4" />
                                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <p className="text-gray-600 mb-6">Fehler beim Laden der Produkte.</p>
                            <button
                                onClick={fetchProducts}
                                className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-medium"
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