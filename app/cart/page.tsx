// app/cart/page.tsx
'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
    const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
    const total = getTotal();
    const shipping = total > 49 ? 0 : 4.99;
    const finalTotal = total + shipping;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Header />

                <main className="pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl mx-auto text-center py-16">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4 tracking-tight">
                                Ihr Warenkorb ist leer
                            </h1>
                            <p className="text-lg text-gray-600 mb-8">
                                Entdecken Sie unsere exklusive Auswahl an Premium-Kosmetik
                            </p>
                            <Link
                                href="/catalog"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all"
                            >
                                Zum Katalog
                                <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                            </Link>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-2 tracking-tight">
                                Warenkorb
                            </h1>
                            <p className="text-gray-600">
                                {items.length} {items.length === 1 ? 'Artikel' : 'Artikel'}
                            </p>
                        </div>
                        <button
                            onClick={clearCart}
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Alle entfernen
                        </button>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.product.id}
                                    className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex gap-6">
                                        {/* Image */}
                                        <Link
                                            href={`/product/${item.product.slug}`}
                                            className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0"
                                        >
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{
                                                    backgroundImage: `url(${item.product.images[0]})`
                                                }}
                                            />
                                        </Link>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    {item.product.brand && (
                                                        <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mb-1">
                                                            {item.product.brand}
                                                        </p>
                                                    )}
                                                    <Link
                                                        href={`/product/${item.product.slug}`}
                                                        className="text-base sm:text-lg font-medium text-gray-900 hover:text-gray-600 transition-colors block line-clamp-2"
                                                    >
                                                        {item.product.name}
                                                    </Link>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.product.id)}
                                                    className="text-gray-400 hover:text-gray-900 transition-colors p-2"
                                                >
                                                    <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                                                </button>
                                            </div>

                                            <div className="flex items-end justify-between gap-4 mt-4">
                                                {/* Quantity */}
                                                <div className="flex items-center border border-gray-200 rounded-full">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.product.id,
                                                                item.quantity - 1
                                                            )
                                                        }
                                                        className="p-2 hover:bg-gray-50 transition-colors rounded-l-full"
                                                    >
                                                        <Minus className="w-4 h-4" strokeWidth={1.5} />
                                                    </button>
                                                    <span className="px-4 py-2 font-medium min-w-[50px] text-center text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.product.id,
                                                                item.quantity + 1
                                                            )
                                                        }
                                                        disabled={item.quantity >= item.product.stockQuantity}
                                                        className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r-full"
                                                    >
                                                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                                                    </button>
                                                </div>

                                                {/* Price */}
                                                <div className="text-right">
                                                    <div className="text-xl sm:text-2xl font-medium text-gray-900">
                                                        {formatPrice(item.product.price * item.quantity)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatPrice(item.product.price)} / Stück
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stock warning */}
                                            {item.quantity >= item.product.stockQuantity && (
                                                <p className="text-xs text-amber-600 mt-2">
                                                    Maximale verfügbare Menge erreicht
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 sticky top-24 border border-gray-100">
                                <h2 className="text-2xl font-light text-gray-900 mb-6 tracking-tight">
                                    Zusammenfassung
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between text-gray-600">
                                        <span className="text-sm">Zwischensumme</span>
                                        <span className="font-medium">{formatPrice(total)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-600">
                                        <span className="text-sm">Versand</span>
                                        <span className="font-medium">
                                            {shipping === 0 ? (
                                                <span className="text-green-600">Kostenlos</span>
                                            ) : (
                                                formatPrice(shipping)
                                            )}
                                        </span>
                                    </div>

                                    {/* Free shipping progress */}
                                    {total < 49 && (
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                                <span>Noch bis kostenloser Versand:</span>
                                                <span className="font-medium">
                                                    {formatPrice(49 - total)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${(total / 49) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-200 pt-4 mt-6">
                                        <div className="flex items-center justify-between text-xl font-medium text-gray-900">
                                            <span>Gesamt</span>
                                            <span>{formatPrice(finalTotal)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Inkl. MwSt.</p>
                                    </div>
                                </div>

                                <Link
                                    href="/checkout"
                                    className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mb-3"
                                >
                                    Zur Kasse
                                    <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                                </Link>

                                <Link
                                    href="/catalog"
                                    className="w-full border border-gray-200 text-gray-700 py-4 rounded-full font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
                                    Weiter einkaufen
                                </Link>

                                {/* Features */}
                                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                                        <span>Sichere Zahlung</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                                        <span>14 Tage Rückgaberecht</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                                        <span>Versand in 2-3 Werktagen</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Continue Shopping Banner */}
                    <div className="mt-16 bg-gray-50 rounded-3xl p-8 sm:p-12 text-center border border-gray-100">
                        <h3 className="text-2xl sm:text-3xl font-light text-gray-900 mb-3 tracking-tight">
                            Noch mehr entdecken?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Schauen Sie sich unsere Neuheiten und Bestseller an
                        </p>
                        <Link
                            href="/catalog"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all"
                        >
                            Zum Katalog
                            <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
