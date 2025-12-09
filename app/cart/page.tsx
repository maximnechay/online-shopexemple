// app/cart/page.tsx
'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { useShopSettings } from '@/lib/hooks/useShopSettings';

export default function CartPage() {
    const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
    const total = getTotal();

    // настройки магазина
    const { settings } = useShopSettings();

    // порог бесплатной доставки и базовый шиппинг
    const freeShippingFrom = settings?.freeShippingFrom ?? 49;
    const baseShipping = settings?.shippingCost ?? 4.99;

    const shipping = total >= freeShippingFrom ? 0 : baseShipping;
    const finalTotal = total + shipping;

    // Прогресс до бесплатной доставки
    const progressToFreeShipping = Math.min((total / freeShippingFrom) * 100, 100);
    const amountToFreeShipping = Math.max(0, freeShippingFrom - total);

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <main className="flex-1 pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                            <ShoppingBag className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-3xl font-serif text-gray-900 mb-4">
                            Ihr Warenkorb ist leer
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            Entdecken Sie unsere Produkte und finden Sie Ihre neuen Favoriten.
                        </p>
                        <Link
                            href="/catalog"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Weiter einkaufen
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-8">
                        Warenkorb
                    </h1>

                    {/* Free shipping progress */}
                    {amountToFreeShipping > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                            <p className="text-sm text-amber-800 mb-2">
                                Noch <span className="font-medium">{formatPrice(amountToFreeShipping)}</span> bis zur kostenlosen Lieferung!
                            </p>
                            <div className="w-full bg-amber-200 rounded-full h-2">
                                <div
                                    className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progressToFreeShipping}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {amountToFreeShipping <= 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8">
                            <p className="text-sm text-green-800 font-medium">
                                🎉 Sie erhalten kostenlose Lieferung!
                            </p>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => {
                                // ✅ Определяем цену и изображение с учётом варианта
                                const itemPrice = item.variantPrice ?? item.product.price;
                                const itemImage = item.variantImage || item.product.images?.[0];
                                const itemName = item.variantName
                                    ? `${item.product.name} - ${item.variantName}`
                                    : item.product.name;

                                return (
                                    <div
                                        key={`${item.product.id}-${item.variantId || 'main'}`}
                                        className="flex gap-4 p-4 bg-gray-50 rounded-2xl"
                                    >
                                        {/* Image */}
                                        <Link
                                            href={`/product/${item.product.slug}`}
                                            className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-gray-100"
                                        >
                                            {itemImage && (
                                                <div
                                                    className="w-full h-full bg-cover bg-center"
                                                    style={{ backgroundImage: `url(${itemImage})` }}
                                                />
                                            )}
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
                                                        {itemName}
                                                    </Link>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.product.id, item.variantId)}
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
                                                                item.quantity - 1,
                                                                item.variantId
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
                                                                item.quantity + 1,
                                                                item.variantId
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
                                                        {formatPrice(itemPrice * item.quantity)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatPrice(itemPrice)} / Stück
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stock warning */}
                                            {item.product.stockQuantity === 0 ? (
                                                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
                                                    <p className="text-xs text-red-700 font-medium">
                                                        ⚠️ Nicht auf Lager - Bitte entfernen Sie diesen Artikel
                                                    </p>
                                                </div>
                                            ) : item.quantity > item.product.stockQuantity ? (
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                                                    <p className="text-xs text-amber-700 font-medium">
                                                        ⚠️ Nur noch {item.product.stockQuantity} verfügbar - Menge anpassen
                                                    </p>
                                                </div>
                                            ) : item.quantity >= item.product.stockQuantity ? (
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                                                    <p className="text-xs text-amber-700 font-medium">
                                                        ℹ️ Maximale Menge erreicht
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4">
                                <Link
                                    href="/catalog"
                                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Weiter einkaufen
                                </Link>
                                <button
                                    onClick={clearCart}
                                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    Warenkorb leeren
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-50 rounded-3xl p-6 sticky top-24">
                                <h2 className="text-xl font-medium text-gray-900 mb-6">
                                    Zusammenfassung
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Zwischensumme</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Versandkosten</span>
                                        <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                                            {shipping === 0 ? 'Kostenlos' : formatPrice(shipping)}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4 flex justify-between text-xl font-medium text-gray-900">
                                        <span>Gesamt</span>
                                        <span>{formatPrice(finalTotal)}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mb-6">
                                    inkl. MwSt.
                                </p>

                                <Link
                                    href="/checkout"
                                    className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    Zur Kasse
                                    <ArrowRight className="w-5 h-5" />
                                </Link>

                                {/* Payment methods */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 text-center mb-3">
                                        Sichere Zahlung mit
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="text-xs text-gray-400">PayPal</div>
                                        <div className="text-xs text-gray-400">Kreditkarte</div>
                                        <div className="text-xs text-gray-400">Barzahlung</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}