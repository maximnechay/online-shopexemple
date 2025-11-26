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
import ProductCard from '@/components/shop/ProductCard';
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
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Пагинация
    const [currentPage, setCurrentPage] = useState(
        parseInt(searchParams.get('page') || '1')
    );
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory]);

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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateURL({ page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <div className="flex-1 pt-40 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
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

            <div className="flex-1 pt-40 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                            Katalog
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            Entdecken Sie unsere Premium-Auswahl an Kosmetikprodukten
                        </p>
                    </motion.div>

                    {/* Mobile Filter Button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="md:hidden mb-4"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            aria-label="Filter öffnen"
                            aria-expanded={showMobileFilters}
                        >
                            <Filter className="w-5 h-5" />
                            <span>Filter & Sortierung</span>
                        </motion.button>
                    </motion.div>

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
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl p-6 overflow-y-auto z-50"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-medium">Filter & Sortierung</h2>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowMobileFilters(false)}
                                            aria-label="Filter schließen"
                                        >
                                            <X className="w-6 h-6" />
                                        </motion.button>
                                    </div>

                                    {/* Category Filter Mobile */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium mb-3">Kategorie</h3>
                                        <div className="space-y-2">
                                            <motion.button
                                                whileHover={{ x: 5 }}
                                                onClick={() => handleCategoryChange('all')}
                                                className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === 'all'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Alle
                                            </motion.button>
                                            {categories.map((cat) => (
                                                <motion.button
                                                    key={cat.id}
                                                    whileHover={{ x: 5 }}
                                                    onClick={() => handleCategoryChange(cat.id)}
                                                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.id
                                                        ? 'bg-black text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {cat.name}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sort Mobile */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium mb-3">Sortierung</h3>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => handleSortChange(e.target.value as SortOption)}
                                            className="w-full px-4 py-2 text-sm border border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-gray-900"
                                            aria-label="Sortierung auswählen"
                                        >
                                            <option value="newest">Neueste zuerst</option>
                                            <option value="price-asc">Preis aufsteigend</option>
                                            <option value="price-desc">Preis absteigend</option>
                                            <option value="name-asc">Name A-Z</option>
                                            <option value="name-desc">Name Z-A</option>
                                        </select>
                                    </div>

                                    {/* Stock Filter Mobile */}
                                    <div>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleInStockToggle}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${inStockOnly
                                                ? 'bg-black text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            aria-label="Nur verfügbare Produkte anzeigen"
                                            aria-pressed={inStockOnly}
                                        >
                                            <Filter className="w-4 h-4" />
                                            Nur verfügbar
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Desktop Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8"
                    >
                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCategoryChange('all')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === 'all'
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                aria-label="Alle Kategorien anzeigen"
                                aria-pressed={selectedCategory === 'all'}
                            >
                                Alle
                            </motion.button>
                            {categories.map((cat) => (
                                <motion.button
                                    key={cat.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.id
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    aria-label={`${cat.name} Kategorie anzeigen`}
                                    aria-pressed={selectedCategory === cat.id}
                                >
                                    {cat.name}
                                </motion.button>
                            ))}
                        </div>

                        {/* Sort & Filter Options */}
                        <div className="flex gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                                className="px-4 py-2 text-sm border border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-gray-900"
                                aria-label="Sortierung auswählen"
                            >
                                <option value="newest">Neueste zuerst</option>
                                <option value="price-asc">Preis aufsteigend</option>
                                <option value="price-desc">Preis absteigend</option>
                                <option value="name-asc">Name A-Z</option>
                                <option value="name-desc">Name Z-A</option>
                            </select>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleInStockToggle}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${inStockOnly
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                aria-label="Nur verfügbare Produkte anzeigen"
                                aria-pressed={inStockOnly}
                            >
                                <Filter className="w-4 h-4" />
                                Nur verfügbar
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Active Filters */}
                    <AnimatePresence>
                        {(selectedCategory !== 'all' || inStockOnly) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 flex flex-wrap gap-2 items-center overflow-hidden"
                            >
                                <span className="text-sm text-gray-600">Aktive Filter:</span>
                                {selectedCategory !== 'all' && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleCategoryChange('all')}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
                                    >
                                        {categories.find(c => c.id === selectedCategory)?.name}
                                        <X className="w-4 h-4" />
                                    </motion.button>
                                )}
                                {inStockOnly && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleInStockToggle}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
                                    >
                                        Nur verfügbar
                                        <X className="w-4 h-4" />
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Products Grid */}
                    {paginatedProducts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20"
                        >
                            <p className="text-gray-600 mb-4">Keine Produkte gefunden</p>
                            {(selectedCategory !== 'all' || inStockOnly) && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setSelectedCategory('all');
                                        setInStockOnly(false);
                                        updateURL({ category: 'all', inStock: false });
                                    }}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    Filter zurücksetzen
                                </motion.button>
                            )}
                        </motion.div>
                    ) : (
                        <>
                            <motion.div
                                key={`page-${currentPage}-${selectedCategory}`}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            >
                                {paginatedProducts.map((product) => (
                                    <motion.div
                                        key={product.id}
                                        variants={cardVariants}
                                        layout
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-12 flex justify-center items-center gap-2"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Vorherige Seite"
                                    >
                                        Zurück
                                    </motion.button>

                                    <div className="flex gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <motion.button
                                                key={page}
                                                whileHover={{ scale: currentPage === page ? 1 : 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-4 py-2 text-sm transition-colors ${currentPage === page
                                                    ? 'bg-black text-white'
                                                    : 'border border-gray-300 hover:bg-gray-100'
                                                    }`}
                                                aria-label={`Seite ${page}`}
                                                aria-current={currentPage === page ? 'page' : undefined}
                                            >
                                                {page}
                                            </motion.button>
                                        ))}
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Nächste Seite"
                                    >
                                        Weiter
                                    </motion.button>
                                </motion.div>
                            )}
                        </>
                    )}

                    {/* Results count */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-12 text-center text-sm text-gray-500"
                    >
                        {sortedProducts.length} {sortedProducts.length === 1 ? 'Produkt' : 'Produkte'}{' '}
                        gefunden
                        {totalPages > 1 && (
                            <span> · Seite {currentPage} von {totalPages}</span>
                        )}
                    </motion.div>
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