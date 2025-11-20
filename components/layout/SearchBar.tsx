'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    brand?: string;
}

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchProducts = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data);
                setIsOpen(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            router.push(`/catalog?search=${encodeURIComponent(query)}`);
            setIsOpen(false);
        }
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-xl">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Suche nach Produkten..."
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-[400px] overflow-y-auto z-50">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            Suche läuft...
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            <div className="p-2">
                                {results.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/product/${product.slug}`}
                                        onClick={() => {
                                            setIsOpen(false);
                                            setQuery('');
                                        }}
                                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        <div
                                            className="w-16 h-16 rounded-lg bg-gray-100 bg-cover bg-center flex-shrink-0"
                                            style={{ backgroundImage: `url(${product.images[0]})` }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            {product.brand && (
                                                <p className="text-xs text-gray-500 uppercase">
                                                    {product.brand}
                                                </p>
                                            )}
                                            <p className="font-medium text-gray-900 truncate">
                                                {product.name}
                                            </p>
                                            <p className="text-sm font-bold text-rose-600">
                                                {formatPrice(product.price)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={`/catalog?search=${encodeURIComponent(query)}`}
                                onClick={() => setIsOpen(false)}
                                className="block p-4 text-center text-rose-600 hover:bg-gray-50 font-medium border-t"
                            >
                                Alle Ergebnisse anzeigen →
                            </Link>
                        </>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            Keine Produkte gefunden für "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}