'use client';

import Link from 'next/link';
import { Package, PlusCircle, Settings, ShoppingBasket } from 'lucide-react';

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-6 py-20">

                <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-12">
                    Admin Dashboard
                </h1>

                <p className="text-gray-600 text-lg mb-16 max-w-2xl">
                    Verwalten Sie Produkte, Kategorien und Shop-Einstellungen bequem an einem Ort.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Produkte */}
                    <Link
                        href="/admin/products"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShoppingBasket className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Produkte verwalten
                        </h2>

                        <p className="text-gray-600 text-sm">
                            Produkte hinzufügen, bearbeiten oder entfernen.
                        </p>
                    </Link>

                    {/* Neues Produkt */}
                    <Link
                        href="/admin/products/create"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <PlusCircle className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Neues Produkt hinzufügen
                        </h2>

                        <p className="text-gray-600 text-sm">
                            Schnelles Anlegen neuer Produkte im Shop.
                        </p>
                    </Link>

                    {/* Einstellungen */}
                    <Link
                        href="/admin/settings"
                        className="group p-8 bg-gray-50 rounded-3xl border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Settings className="w-7 h-7" />
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Shop Einstellungen
                        </h2>

                        <p className="text-gray-600 text-sm">
                            Allgemeine Informationen und Konfiguration des Shops.
                        </p>
                    </Link>

                </div>

            </div>
        </div>
    );
}
