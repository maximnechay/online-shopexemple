// components/layout/Header.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Search, Menu, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';

export default function Header() {
    const [mounted, setMounted] = useState(false);
    const itemCount = useCartStore((state) => state.getItemCount());

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-600 rounded-full flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-serif font-light tracking-wide text-gray-900">
                            Élégance
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden lg:flex items-center gap-10">
                        <Link href="/" className="text-sm font-medium text-gray-900 hover:text-rose-600 transition-colors">
                            Startseite
                        </Link>
                        <Link href="/catalog" className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors">
                            Katalog
                        </Link>
                        <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors">
                            Über uns
                        </Link>
                        <Link href="/contacts" className="text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors">
                            Kontakt
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                        <button className="hidden md:block text-gray-600 hover:text-rose-600 transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="text-gray-600 hover:text-rose-600 transition-colors">
                            <Heart className="w-5 h-5" />
                        </button>
                        <Link href="/cart" className="relative text-gray-600 hover:text-rose-600 transition-colors">
                            <ShoppingBag className="w-5 h-5" />
                            {mounted && itemCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                    {itemCount}
                                </span>
                            )}
                        </Link>
                        <button className="lg:hidden text-gray-600">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}