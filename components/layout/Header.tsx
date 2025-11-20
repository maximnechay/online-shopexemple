'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, User, Heart, LogOut, Package, Settings } from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';
import SearchBar from './SearchBar';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useAuth } from '@/lib/contexts/AuthContext';
export default function Header() {
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const itemCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
    const wishlistCount = useWishlistStore((state) => state.items.length);
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Закрытие меню пользователя при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setIsUserMenuOpen(false);
        router.push('/');
    };

    const getUserInitials = () => {
        if (!user?.user_metadata) return 'U';
        const firstName = user.user_metadata.first_name || '';
        const lastName = user.user_metadata.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    };

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

                        {/* User Menu */}
                        {!loading && (
                            <div className="relative hidden lg:block" ref={userMenuRef}>
                                {user ? (
                                    <>
                                        <button
                                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                            className="flex items-center gap-2 p-2 text-gray-700 hover:text-rose-600 transition-colors"
                                        >
                                            <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-medium text-sm">
                                                {getUserInitials()}
                                            </div>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isUserMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                                <div className="px-4 py-3 border-b border-gray-200">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Settings className="w-5 h-5" />
                                                    <span>Mein Profil</span>
                                                </Link>
                                                <Link
                                                    href="/profile/orders"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Package className="w-5 h-5" />
                                                    <span>Meine Bestellungen</span>
                                                </Link>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full"
                                                >
                                                    <LogOut className="w-5 h-5" />
                                                    <span>Abmelden</span>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href="/auth/login"
                                        className="p-2 text-gray-700 hover:text-rose-600 transition-colors"
                                    >
                                        <User className="w-6 h-6" />
                                    </Link>
                                )}
                            </div>
                        )}

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