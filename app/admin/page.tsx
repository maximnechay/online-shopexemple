'use client';

import Link from 'next/link';
import {
    Package,
    PlusCircle,
    Settings,
    ShoppingBasket,
    ShoppingCart,
    MessageSquare,
    Mail,
    ArrowLeft,
    Users,
    Layers,
    Star,
    Tag,
    Home,
} from 'lucide-react';

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">

                {/* Back to Site Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zur Website
                </Link>

                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-light text-gray-900 tracking-tight mb-6">
                    Admin Dashboard
                </h1>

                <p className="text-gray-600 text-lg mb-14 max-w-xl">
                    Verwalten Sie Produkte, neue Artikel und Einstellungen Ihres Shops.
                </p>

                {/* Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Bestellungen */}
                    <Link
                        href="/admin/orders"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Bestellungen
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Alle Kundenbestellungen verwalten und Status aktualisieren.
                        </p>
                    </Link>

                    {/* Startseite verwalten */}
                    <Link
                        href="/admin/home"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Home className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Startseite
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Hero-Banner, Bestseller und Mini-Banner auf der Startseite verwalten.
                        </p>
                    </Link>

                    {/* Benutzer */}
                    <Link
                        href="/admin/users"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Users className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Benutzer
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Registrierte Kunden und ihre Newsletter-Abonnements verwalten.
                        </p>
                    </Link>

                    {/* Marketing-E-Mails */}
                    <Link
                        href="/admin/newsletter"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Mail className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Marketing-E-Mails
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Senden Sie Marketing-E-Mails an Newsletter-Abonnenten.
                        </p>
                    </Link>

                    {/* SMS-Nachrichten */}
                    <Link
                        href="/admin/sms"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            SMS-Nachrichten
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Senden Sie SMS an Newsletter-Abonnenten und Kunden.
                        </p>
                    </Link>

                    {/* Bewertungen */}
                    <Link
                        href="/admin/reviews"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Star className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Bewertungen
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Kundenbewertungen moderieren und verwalten.
                        </p>
                    </Link>

                    {/* Produkte */}
                    <Link
                        href="/admin/products"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShoppingBasket className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Produkte verwalten
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Bestehende Produkte bearbeiten, Inventar pflegen und Preise aktualisieren.
                        </p>
                    </Link>

                    {/* Kategorien */}
                    <Link
                        href="/admin/categories"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Layers className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Kategorien
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Produktkategorien verwalten und organisieren.
                        </p>
                    </Link>

                    {/* Attribute */}
                    <Link
                        href="/admin/attributes"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Tag className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Attribute
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Produktattribute und Filter für den Katalog verwalten.
                        </p>
                    </Link>

                    {/* Product Variants */}
                    <Link
                        href="/admin/product-variants"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Produktvarianten
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Verknüpfen Sie zusammengehörige Produkte (z.B. verschiedene Größen).
                        </p>
                    </Link>

                    {/* Gutscheine */}
                    <Link
                        href="/admin/coupons"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Tag className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Gutscheine & Rabatte
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Erstellen und verwalten Sie Gutscheincodes für Rabatte.
                        </p>
                    </Link>

                    {/* Neues Produkt */}
                    <Link
                        href="/admin/products/create"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <PlusCircle className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Neues Produkt hinzufügen
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Fügen Sie Ihrem Sortiment schnell und einfach neue Artikel hinzu.
                        </p>
                    </Link>

                    {/* Einstellungen */}
                    <Link
                        href="/admin/settings"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Settings className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Shop Einstellungen
                        </h2>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            Verwalten Sie allgemeine Shop-Daten, Layout und Konfiguration.
                        </p>
                    </Link>
                </div>

            </div>
        </div>
    );
}