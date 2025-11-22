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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                isScrolled
                    ? 'bg-white/80 backdrop-blur-xl shadow-medium border-b border-neutral-200/50'
                    : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 group">
                        <h1 className="text-2xl font-serif font-semibold text-neutral-900 transition-all duration-300">
                            Beauty<span className="text-gradient bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:from-primary-700 group-hover:to-secondary-700 transition-all">Shop</span>
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
                            className="relative text-neutral-700 hover:text-primary-600 transition-all duration-300 font-medium group"
                        >
                            Home
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link
                            href="/catalog"
                            className="relative text-neutral-700 hover:text-primary-600 transition-all duration-300 font-medium group"
                        >
                            Katalog
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link
                            href="/about"
                            className="relative text-neutral-700 hover:text-primary-600 transition-all duration-300 font-medium group"
                        >
                            Über uns
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link
                            href="/contact"
                            className="relative text-neutral-700 hover:text-primary-600 transition-all duration-300 font-medium group"
                        >
                            Kontakt
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 group-hover:w-full transition-all duration-300" />
                        </Link>
                    </nav>

                    {/* Icons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/wishlist"
                            className="relative p-2.5 text-neutral-700 hover:text-primary-600 transition-all duration-300 rounded-xl hover:bg-primary-50 hidden lg:block group"
                        >
                            <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            {wishlistCount > 0 && (
                                <span className="absolute top-0 right-0 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-glow animate-scale-in">
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
                                            className="flex items-center gap-2 p-2.5 text-neutral-700 hover:text-primary-600 transition-all duration-300 rounded-xl hover:bg-primary-50 group"
                                        >
                                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-soft group-hover:shadow-glow transition-all">
                                                {getUserInitials()}
                                            </div>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isUserMenuOpen && (
                                            <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-hard border border-neutral-200/50 py-2 z-50 animate-fade-in-down">
                                                <div className="px-5 py-4 border-b border-neutral-200">
                                                    <p className="text-sm font-semibold text-neutral-900">
                                                        {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 truncate mt-1">{user.email}</p>
                                                </div>
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-5 py-3 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200 group"
                                                >
                                                    <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                                    <span className="font-medium">Mein Profil</span>
                                                </Link>
                                                <Link
                                                    href="/profile/orders"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-5 py-3 text-neutral-700 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200 group"
                                                >
                                                    <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    <span className="font-medium">Meine Bestellungen</span>
                                                </Link>
                                                <div className="border-t border-neutral-200 mt-2 pt-2">
                                                    <button
                                                        onClick={handleSignOut}
                                                        className="flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 transition-all duration-200 w-full group"
                                                    >
                                                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                                        <span className="font-medium">Abmelden</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href="/auth/login"
                                        className="p-2.5 text-neutral-700 hover:text-primary-600 transition-all duration-300 rounded-xl hover:bg-primary-50 group"
                                    >
                                        <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    </Link>
                                )}
                            </div>
                        )}

                        <Link
                            href="/cart"
                            className="relative p-2.5 text-neutral-700 hover:text-primary-600 transition-all duration-300 rounded-xl hover:bg-primary-50 group"
                        >
                            <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            {itemCount > 0 && (
                                <span className="absolute top-0 right-0 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-glow animate-scale-in">
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