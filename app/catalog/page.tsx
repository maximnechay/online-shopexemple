// app/catalog/page.tsx
'use client';

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
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                            Каталог кроссовок
                        </h1>
                        <p className="text-lg text-gray-600">
                            Откройте для себя нашу эксклюзивную коллекцию премиум кроссовок
                        </p>
                    </div>

                    {/* Categories */}
                    <div className="mb-8 overflow-x-auto">
                        <div className="flex gap-3 pb-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Все кроссовки
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${selectedCategory === category.id
                                        ? 'bg-gray-900 text-white'
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
                                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                />
                                <span className="text-sm text-gray-700">Только в наличии</span>
                            </label>

                            <span className="text-sm text-gray-600">
                                {sortedProducts.length} {sortedProducts.length === 1 ? 'товар' : 'товаров'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 hidden sm:block">Сортировка:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            >
                                <option value="newest">Новинки</option>
                                <option value="popular">Популярные</option>
                                <option value="price-asc">Цена: по возрастанию</option>
                                <option value="price-desc">Цена: по убыванию</option>
                                <option value="name-asc">Название: А → Я</option>
                                <option value="name-desc">Название: Я → А</option>
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
                                Ошибка при загрузке товаров.
                            </p>
                            <button
                                onClick={fetchProducts}
                                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Попробовать снова
                            </button>
                        </div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-lg text-gray-600">
                                В этой категории пока нет товаров.
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