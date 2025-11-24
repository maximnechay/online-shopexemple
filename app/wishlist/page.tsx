'use client';

import { Trash2, ShoppingBag, Heart } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

export default function WishlistPage() {
    const { items, removeItem, clearWishlist } = useWishlistStore();
    const { addItem: addToCart } = useCartStore();
    const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

    const handleAddToCart = (product: any) => {
        addToCart(product, 1);
        setAddedItems(prev => new Set(prev).add(product.id));
        setTimeout(() => {
            setAddedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-38 md:pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                            Meine Wunschliste
                        </h1>
                        <p className="text-lg text-gray-600">
                            {items.length} {items.length === 1 ? 'Produkt' : 'Produkte'} gespeichert
                        </p>
                    </div>

                    {items.length === 0 ? (
                        /* Empty State */
                        <div className="bg-white rounded-2xl p-16 text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-12 h-12 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-serif text-gray-900 mb-2">
                                Ihre Wunschliste ist leer
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Speichern Sie Ihre Lieblingsprodukte für später
                            </p>
                            <Link
                                href="/catalog"
                                className="inline-block px-8 py-3 bg-rose-600 text-white rounded-full font-medium hover:bg-rose-700 transition-colors"
                            >
                                Produkte entdecken
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Clear All Button */}
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={clearWishlist}
                                    className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                                >
                                    Alle entfernen
                                </button>
                            </div>

                            {/* Wishlist Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {items.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                                    >
                                        <Link href={`/product/${product.slug}`}>
                                            {/* Image */}
                                            <div className="relative aspect-square overflow-hidden bg-gray-50">
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                                    style={{ backgroundImage: `url(${product.images[0]})` }}
                                                />
                                                {!product.inStock && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <span className="text-white font-medium">Ausverkauft</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Info */}
                                        <div className="p-4">
                                            {product.brand && (
                                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                    {product.brand}
                                                </p>
                                            )}
                                            <Link
                                                href={`/product/${product.slug}`}
                                                className="font-medium text-gray-900 hover:text-rose-600 transition-colors line-clamp-2 mb-2 block"
                                            >
                                                {product.name}
                                            </Link>

                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-xl font-bold text-gray-900">
                                                    {formatPrice(product.price)}
                                                </span>
                                                {product.compareAtPrice && (
                                                    <span className="text-sm text-gray-400 line-through">
                                                        {formatPrice(product.compareAtPrice)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                {product.inStock && (
                                                    <button
                                                        onClick={() => handleAddToCart(product)}
                                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${addedItems.has(product.id)
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-rose-600 text-white hover:bg-rose-700'
                                                            }`}
                                                    >
                                                        <ShoppingBag className="w-4 h-4" />
                                                        {addedItems.has(product.id) ? 'Hinzugefügt!' : 'In Warenkorb'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => removeItem(product.id)}
                                                    className="p-2 border border-gray-300 rounded-lg hover:border-red-600 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}