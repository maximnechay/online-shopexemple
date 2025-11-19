// app/catalog/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shop/ProductCard';
import { ProductCategory, SortOption } from '@/lib/types';
import { categories } from '@/lib/data/products';

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compare_at_price?: number;
    images: string[];
    category: string;
    brand?: string;
    in_stock: boolean;
    stock_quantity: number;
    tags: string[];
    rating?: number;
    review_count?: number;
    created_at: string;
    updated_at: string;
}

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [inStockOnly, setInStockOnly] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, inStockOnly]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }
            if (inStockOnly) {
                params.append('inStockOnly', 'true');
            }

            const response = await fetch(`/api/products?${params}`);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Sort products
    const sortedProducts = [...products].sort((a, b) => {
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
                return (b.review_count || 0) - (a.review_count || 0);
            case 'newest':
            default:
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    });

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                            Produktkatalog
                        </h1>
                        <p className="text-lg text-gray-600">
                            Entdecken Sie unsere exklusive Auswahl an Premium-Kosmetik
                        </p>
                    </div>

                    {/* Categories */}
                    <div className="mb-8 overflow-x-auto">
                        <div className="flex gap-3 pb-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Alle Produkte
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${selectedCategory === category.id
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters & Sort Bar */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                />
                                <span className="text-sm text-gray-700">Nur verfügbare</span>
                            </label>

                            <span className="text-sm text-gray-600">
                                {sortedProducts.length} {sortedProducts.length === 1 ? 'Produkt' : 'Produkte'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 hidden sm:block">Sortieren:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-square bg-gray-200 rounded-2xl mb-4" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : sortedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sortedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-xl text-gray-600 mb-4">
                                Keine Produkte gefunden
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setInStockOnly(false);
                                }}
                                className="text-rose-600 hover:text-rose-700 font-medium"
                            >
                                Filter zurücksetzen
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}