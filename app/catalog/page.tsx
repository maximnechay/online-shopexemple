// app/catalog/page.tsx
'use client';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/shop/ProductGrid';
import AttributeFilters from '@/components/catalog/AttributeFilters';
import { Product, ProductCategory, SortOption } from '@/lib/types';
import { useCategories } from '@/lib/hooks/useCategories';
import { viewItemList } from '@/lib/analytics';

function CatalogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Инициализация из URL параметров
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>(
        searchParams.get('category') || 'all'
    );
    const { categories } = useCategories();
    const [sortBy, setSortBy] = useState<SortOption>(
        (searchParams.get('sort') as SortOption) || 'newest'
    );
    const [inStockOnly, setInStockOnly] = useState(
        searchParams.get('inStock') === 'true'
    );
    const [attributeFilters, setAttributeFilters] = useState<{ [key: string]: string[] }>({});
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Пагинация
    const [currentPage, setCurrentPage] = useState(
        parseInt(searchParams.get('page') || '1')
    );
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, attributeFilters]);

    // Analytics при загрузке товаров
    useEffect(() => {
        if (products.length > 0 && typeof window.gtag !== 'undefined') {
            viewItemList(
                products.slice(0, ITEMS_PER_PAGE).map(product => ({
                    id: product.id,
                    name: product.name,
                    category: product.category || 'beauty',
                    price: product.price,
                })),
                selectedCategory === 'all' ? 'Alle Produkte' : categories.find(c => c.id === selectedCategory)?.name || 'Katalog'
            );
        }
    }, [products, currentPage]);

    // Синхронизация с URL
    const updateURL = (updates: {
        category?: string;
        sort?: string;
        inStock?: boolean;
        page?: number;
    }) => {
        const params = new URLSearchParams(searchParams.toString());

        if (updates.category !== undefined) {
            if (updates.category === 'all') {
                params.delete('category');
            } else {
                params.set('category', updates.category);
            }
        }

        if (updates.sort !== undefined) {
            if (updates.sort === 'newest') {
                params.delete('sort');
            } else {
                params.set('sort', updates.sort);
            }
        }

        if (updates.inStock !== undefined) {
            if (updates.inStock) {
                params.set('inStock', 'true');
            } else {
                params.delete('inStock');
            }
        }

        if (updates.page !== undefined) {
            if (updates.page === 1) {
                params.delete('page');
            } else {
                params.set('page', updates.page.toString());
            }
        }

        const queryString = params.toString();
        router.push(queryString ? `/catalog?${queryString}` : '/catalog', { scroll: false });
    };

    const fetchProducts = async () => {
        setLoading(true);
        setError(false);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }

            // Add attribute filters
            if (Object.keys(attributeFilters).length > 0) {
                params.append('attributes', JSON.stringify(attributeFilters));
            }

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

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        updateURL({ category, page: 1 });
        setShowMobileFilters(false);
    };

    const handleSortChange = (sort: SortOption) => {
        setSortBy(sort);
        updateURL({ sort });
    };

    const handleInStockToggle = () => {
        const newValue = !inStockOnly;
        setInStockOnly(newValue);
        setCurrentPage(1);
        updateURL({ inStock: newValue, page: 1 });
    };

    const handleAttributeFilterChange = (attributeSlug: string, valueIds: string[]) => {
        setAttributeFilters(prev => {
            const updated = { ...prev };
            if (valueIds.length === 0) {
                delete updated[attributeSlug];
            } else {
                updated[attributeSlug] = valueIds;
            }
            return updated;
        });
        setCurrentPage(1);
    };

    const handleClearAllFilters = () => {
        setAttributeFilters({});
        setInStockOnly(false);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateURL({ page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Фильтруем товары
    const filteredProducts = products.filter((p) => {
        // Stock filter
        if (inStockOnly && !p.inStock) return false;

        // Price filter
        if (p.price < priceRange[0] || p.price > priceRange[1]) return false;

        return true;
    });

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

    // Пагинация
    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // 🎨 FRAMER MOTION VARIANTS (упрощённые, без ease)
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
            },
        },
    };

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 30,
            scale: 0.95,
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.5,
            },
        },
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <div className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header skeleton */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-12"
                        >
                            <div className="h-12 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
                            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                        </motion.div>

                        {/* Filters skeleton */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-8 flex gap-4"
                        >
                            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded w-28 animate-pulse" />
                        </motion.div>

                        {/* Products grid skeleton */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <motion.div
                                    key={i}
                                    variants={cardVariants}
                                    className="space-y-4"
                                >
                                    <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                                    <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <div className="flex-1 pt-6 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <p className="text-red-600 mb-4">Fehler beim Laden der Produkte</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={fetchProducts}
                                className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
                            >
                                Erneut versuchen
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <div className="flex-1 pt-6 md:pt-16 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                            Katalog
                        </h1>
                        <p className="text-lg text-gray-600">
                            Entdecken Sie unsere Premium-Auswahl an Kosmetikprodukten
                        </p>
                    </motion.div>

                    {/* Mobile Filter Button */}
                    <div className="md:hidden mb-4">
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors rounded-xl"
                        >
                            <Filter className="w-5 h-5" />
                            <span>Filter & Sortierung</span>
                        </button>
                    </div>

                    {/* Main Content: Sidebar + Products */}
                    <div className="flex gap-8">
                        {/* Desktop Sidebar Filters */}
                        <motion.aside
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden md:block w-64 flex-shrink-0"
                        >
                            <div className="sticky top-24 space-y-6">
                                {/* Categories */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                                        Kategorien
                                    </h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleCategoryChange('all')}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedCategory === 'all'
                                                ? 'bg-black text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            Alle Produkte
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategoryChange(cat.id)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedCategory === cat.id
                                                    ? 'bg-black text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                                        Preis
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <input
                                                type="number"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                min="0"
                                            />
                                            <span className="text-gray-500">—</span>
                                            <input
                                                type="number"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                min="0"
                                            />
                                            <span className="text-gray-500">€</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Filter */}
                                <div className="pt-6 border-t border-gray-200">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={inStockOnly}
                                            onChange={handleInStockToggle}
                                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        <span className="text-sm text-gray-700">Nur verfügbare</span>
                                    </label>
                                </div>

                                {/* Attribute Filters */}
                                <div className="pt-6 border-t border-gray-200">
                                    <AttributeFilters
                                        selectedCategory={selectedCategory}
                                        selectedFilters={attributeFilters}
                                        onFilterChange={handleAttributeFilterChange}
                                        onClearAll={handleClearAllFilters}
                                    />
                                </div>
                            </div>
                        </motion.aside>

                        {/* Products Area */}
                        <div className="flex-1">
                            {/* Sort Bar */}
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm text-gray-600">
                                    {sortedProducts.length} {sortedProducts.length === 1 ? 'Produkt' : 'Produkte'}
                                </p>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-gray-900"
                                >
                                    <option value="newest">Neueste zuerst</option>
                                    <option value="price-asc">Preis aufsteigend</option>
                                    <option value="price-desc">Preis absteigend</option>
                                    <option value="name-asc">Name A-Z</option>
                                    <option value="name-desc">Name Z-A</option>
                                </select>
                            </div>

                            {/* Products Grid */}
                            {paginatedProducts.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-600 mb-4">Keine Produkte gefunden</p>
                                    <button
                                        onClick={() => {
                                            setSelectedCategory('all');
                                            setInStockOnly(false);
                                            setAttributeFilters({});
                                            setPriceRange([0, 1000]);
                                        }}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors rounded-xl"
                                    >
                                        Filter zurücksetzen
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                    >
                                        <ProductGrid products={paginatedProducts} animated />
                                    </motion.div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="mt-12 flex justify-center items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Zurück
                                            </button>

                                            <div className="flex gap-2">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${currentPage === page
                                                            ? 'bg-black text-white'
                                                            : 'border border-gray-300 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Weiter
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Filters Drawer */}
                    <AnimatePresence>
                        {showMobileFilters && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowMobileFilters(false)}
                                    className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
                                />
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '-100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl p-6 overflow-y-auto z-50"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-medium">Filter</h2>
                                        <button onClick={() => setShowMobileFilters(false)}>
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Categories Mobile */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Kategorien</h3>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => {
                                                    handleCategoryChange('all');
                                                    setShowMobileFilters(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg ${selectedCategory === 'all' ? 'bg-black text-white' : 'bg-gray-100'
                                                    }`}
                                            >
                                                Alle
                                            </button>
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => {
                                                        handleCategoryChange(cat.id);
                                                        setShowMobileFilters(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg ${selectedCategory === cat.id ? 'bg-black text-white' : 'bg-gray-100'
                                                        }`}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price Mobile */}
                                    <div className="mb-6 pb-6 border-b">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Preis</h3>
                                        <div className="flex items-center gap-2 text-sm">
                                            <input
                                                type="number"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                className="w-20 px-2 py-1 border rounded"
                                            />
                                            <span>—</span>
                                            <input
                                                type="number"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                className="w-20 px-2 py-1 border rounded"
                                            />
                                            <span>€</span>
                                        </div>
                                    </div>

                                    {/* Stock Mobile */}
                                    <div className="mb-6 pb-6 border-b">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={inStockOnly}
                                                onChange={handleInStockToggle}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm">Nur verfügbare</span>
                                        </label>
                                    </div>

                                    {/* Attributes Mobile */}
                                    <AttributeFilters
                                        selectedCategory={selectedCategory}
                                        selectedFilters={attributeFilters}
                                        onFilterChange={handleAttributeFilterChange}
                                        onClearAll={handleClearAllFilters}
                                    />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default function CatalogPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white">
                <Header />
                <div className="pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="animate-pulse">Loading...</div>
                    </div>
                </div>
                <Footer />
            </div>
        }>
            <CatalogContent />
        </Suspense>
    );
}