'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X, User, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';
import SearchBar from './SearchBar'; // ← Добавьте импорт
import { useWishlistStore } from '@/lib/store/useWishlistStore';
export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const itemCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
    const wishlistCount = useWishlistStore((state) => state.items.length);
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0">
                        <h1 className="text-2xl font-serif text-gray-900">
                            Beauty<span className="text-rose-600">Shop</span>
                        </h1>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <div className="hidden lg:block flex-1 mx-8">
                        <SearchBar />
                    </div>

                    {/* Navigation */}
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link
                            href="/"
                            className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                        >
                            Home
                        </Link>
                        <Link
                            href="/catalog"
                            className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                        >
                            Katalog
                        </Link>
                        <Link
                            href="/about"
                            className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                        >
                            Über uns
                        </Link>
                        <Link
                            href="/contact"
                            className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                        >
                            Kontakt
                        </Link>
                    </nav>

                    {/* Icons */}
                    <div className="flex items-center gap-4">
                        <Link href="/wishlist" className="relative p-2 text-gray-700 hover:text-rose-600 transition-colors hidden lg:block">
                            <Heart className="w-6 h-6" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>
                        <button className="p-2 text-gray-700 hover:text-rose-600 transition-colors hidden lg:block">
                            <User className="w-6 h-6" />
                        </button>
                        <Link
                            href="/cart"
                            className="relative p-2 text-gray-700 hover:text-rose-600 transition-colors"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-700"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Search Bar - Mobile */}
                <div className="lg:hidden pb-4">
                    <SearchBar />
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-gray-200 bg-white">
                    <nav className="flex flex-col p-6 gap-4">
                        <Link
                            href="/"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                        >
                            Home
                        </Link>
                        <Link
                            href="/catalog"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                        >
                            Katalog
                        </Link>
                        <Link
                            href="/about"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                        >
                            Über uns
                        </Link>
                        <Link
                            href="/contact"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-gray-700 hover:text-rose-600 transition-colors font-medium"
                        >
                            Kontakt
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}