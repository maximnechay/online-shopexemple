'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, User, Heart, LogOut, Package, Settings, Search, Sparkles } from 'lucide-react';
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
    const [showSearchBar, setShowSearchBar] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);
    const itemCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
    const wishlistCount = useWishlistStore((state) => state.items.length);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
                setShowSearchBar(false);
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
        <>
            {/* Announcement Bar */}
            <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white py-2.5 text-center text-xs sm:text-sm font-medium z-50 relative">
                <div className="flex items-center justify-center gap-2 px-4">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Kostenloser Versand ab 50€ | 14 Tage Rückgaberecht</span>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
            </div>

            <header
                className={`sticky top-0 left-0 right-0 z-40 transition-all duration-500 ${isScrolled
                    ? 'bg-white/98 backdrop-blur-xl shadow-lg border-b border-gray-200'
                    : 'bg-white shadow-sm'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0 group flex items-center gap-3">
                            {/* Logo Image */}
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 group-hover:scale-110">
                                <Image
                                    src="/logo.png"
                                    alt="Élégance Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            {/* Logo Text */}
                            <div className="flex flex-col">
                                <h1 className="text-xl sm:text-2xl font-light tracking-tight text-gray-900 transition-all duration-300 leading-none">
                                    <span className="font-serif italic font-semibold">Élégance</span>
                                </h1>
                                <span className="text-[10px] text-gray-500 tracking-[0.2em] uppercase hidden sm:block">
                                    Beauty & Cosmetics
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                            <Link
                                href="/"
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
                            >
                                Home
                            </Link>
                            <Link
                                href="/catalog"
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
                            >
                                Katalog
                            </Link>

                            <Link
                                href="/about"
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
                            >
                                Über uns
                            </Link>
                            <Link
                                href="/contacts"
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
                            >
                                Kontakt
                            </Link>
                        </nav>

                        {/* Icons */}
                        <div className="flex items-center gap-1">
                            {/* Search Button */}
                            <button
                                onClick={() => setShowSearchBar(!showSearchBar)}
                                className="relative p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 hidden lg:block"
                                aria-label="Search"
                            >
                                <Search className="w-5 h-5" strokeWidth={1.5} />
                            </button>

                            {/* Wishlist */}
                            <Link
                                href="/wishlist"
                                className="relative p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 hidden lg:block group"
                                aria-label="Wishlist"
                            >
                                <Heart className="w-5 h-5 group-hover:fill-gray-200 transition-all" strokeWidth={1.5} />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-gray-900 to-black text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-lg">
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
                                                className="flex items-center gap-2 p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
                                            >
                                                <div className="w-9 h-9 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all">
                                                    {getUserInitials()}
                                                </div>
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isUserMenuOpen && (
                                                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="px-5 py-4 border-b border-gray-100">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                                                                {getUserInitials()}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {user.user_metadata?.first_name}{' '}
                                                                    {user.user_metadata?.last_name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="py-2">
                                                        <Link
                                                            href="/profile"
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                                                        >
                                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                                                <Settings className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-medium">Mein Profil</span>
                                                        </Link>
                                                        <Link
                                                            href="/profile/orders"
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                                                        >
                                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                                                <Package className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-medium">Meine Bestellungen</span>
                                                        </Link>
                                                    </div>
                                                    <div className="border-t border-gray-100 pt-2">
                                                        <button
                                                            onClick={handleSignOut}
                                                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors w-full group"
                                                        >
                                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-red-50 transition-colors">
                                                                <LogOut className="w-4 h-4 group-hover:text-red-600" />
                                                            </div>
                                                            <span className="font-medium group-hover:text-red-600">Abmelden</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            href="/auth/login"
                                            className="p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center"
                                        >
                                            <User className="w-5 h-5" strokeWidth={1.5} />
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* Cart */}
                            <Link
                                href="/cart"
                                className="relative p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 ml-1"
                                aria-label="Shopping Cart"
                            >
                                <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
                                {itemCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-gray-900 to-black text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 ml-1"
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6" strokeWidth={1.5} />
                                ) : (
                                    <Menu className="w-6 h-6" strokeWidth={1.5} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar - Desktop Expanded */}
                    {showSearchBar && (
                        <div
                            ref={searchBarRef}
                            className="hidden lg:block pb-4 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                            <SearchBar />
                        </div>
                    )}

                    {/* Search Bar - Mobile */}
                    <div className="lg:hidden pb-4">
                        <SearchBar />
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl shadow-lg">
                        <nav className="flex flex-col p-6 gap-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {!loading && !user && (
                                <Link
                                    href="/auth/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all mb-2 border-b border-gray-100"
                                >
                                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span>Anmelden</span>
                                </Link>
                            )}
                            {user && (
                                <>
                                    <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-xl">
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                                            {getUserInitials()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                                    >
                                        <Settings className="w-5 h-5" />
                                        <span>Mein Profil</span>
                                    </Link>
                                    <Link
                                        href="/profile/orders"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                                    >
                                        <Package className="w-5 h-5" />
                                        <span>Meine Bestellungen</span>
                                    </Link>
                                    <Link
                                        href="/wishlist"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all mb-2 border-b border-gray-100"
                                    >
                                        <Heart className="w-5 h-5" />
                                        <div className="flex items-center gap-2">
                                            <span>Wunschliste</span>
                                            {wishlistCount > 0 && (
                                                <span className="bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {wishlistCount}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </>
                            )}
                            <Link
                                href="/"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Home
                            </Link>
                            <Link
                                href="/catalog"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Katalog
                            </Link>

                            <Link
                                href="/about"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Über uns
                            </Link>
                            <Link
                                href="/contacts"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Kontakt
                            </Link>
                            {user && (
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-900 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all mt-2 border-t border-gray-100"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Abmelden</span>
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </header>
        </>
    );
}