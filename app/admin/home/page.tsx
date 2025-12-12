'use client';

import Link from 'next/link';
import { ArrowLeft, Image, Star, LayoutGrid } from 'lucide-react';

export default function AdminHomePage() {
    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Dashboard
                </Link>

                <div className="mb-10">
                    <h1 className="text-4xl font-light text-gray-900 mb-2">
                        Startseite verwalten
                    </h1>
                    <p className="text-gray-600">
                        Passe Hero-Banner, Bestseller und Mini-Banner auf der Startseite an.
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* Hero Banner */}
                    <Link
                        href="/admin/home/hero"
                        className="group flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Image className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                Hero Banner
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Großer Banner oben auf der Startseite mit Titel, Bild und Button.
                            </p>
                        </div>
                    </Link>

                    {/* Bestseller */}
                    <Link
                        href="/admin/home/bestsellers"
                        className="group flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Star className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                Bestseller
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Wähle bis zu 4 Produkte für die Bestseller-Sektion aus.
                            </p>
                        </div>
                    </Link>

                    {/* Mini-Banner */}
                    <Link
                        href="/admin/home/mini-banners"
                        className="group flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <LayoutGrid className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                Mini-Banner
                            </h2>
                            <p className="text-gray-600 text-sm">
                                Kleine Promo-Banner unter den Kategorien.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}