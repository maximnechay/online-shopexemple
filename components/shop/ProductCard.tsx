'use client';

import Link from 'next/link';
import { ShoppingBag, Heart } from 'lucide-react';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { Product } from '@/lib/types';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { useState } from 'react';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
    const { addItem: addToCart } = useCartStore();
    const [isAdding, setIsAdding] = useState(false);

    const inWishlist = isInWishlist(product.id);

    const discount = product.compareAtPrice
        ? calculateDiscount(product.price, product.compareAtPrice)
        : 0;

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        if (inWishlist) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product as any);
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!product.inStock) return;

        setIsAdding(true);
        addToCart(product as any, 1);
        setTimeout(() => setIsAdding(false), 1000);
    };

    return (
        <div className="group relative bg-white rounded-3xl overflow-hidden border border-neutral-100 hover:border-neutral-200 transition-all duration-500 shadow-soft hover:shadow-hard transform hover:-translate-y-2">
            <Link href={`/product/${product.slug}`}>
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${product.images[0]})` }}
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Discount Badge */}
                    {discount > 0 && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-accent-600 to-accent-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-glow animate-scale-in">
                            -{discount}%
                        </div>
                    )}

                    {/* Stock Status */}
                    {!product.inStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                                <span className="text-white font-semibold text-lg block mb-1">Ausverkauft</span>
                                <span className="text-white/80 text-sm">Bald wieder verfügbar</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-5">
                    {/* Brand */}
                    {product.brand && (
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-semibold">
                            {product.brand}
                        </p>
                    )}

                    {/* Name */}
                    <h3 className="font-semibold text-neutral-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300 leading-snug">
                        {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                            {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && (
                            <span className="text-sm text-neutral-400 line-through font-medium">
                                {formatPrice(product.compareAtPrice)}
                            </span>
                        )}
                    </div>

                    {/* Rating */}
                    {product.rating && (
                        <div className="flex items-center gap-1.5">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        className={`text-base ${
                                            i < Math.floor(product.rating!)
                                                ? 'text-amber-400'
                                                : 'text-neutral-200'
                                        }`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm text-neutral-600 font-medium">
                                {product.rating} <span className="text-neutral-400">({product.reviewCount || 0})</span>
                            </span>
                        </div>
                    )}
                </div>
            </Link>

            {/* Actions - Outside Link */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                    onClick={handleWishlistToggle}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-medium backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 ${
                        inWishlist
                            ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-glow'
                            : 'bg-white/90 text-neutral-700 hover:bg-primary-600 hover:text-white hover:shadow-glow'
                    }`}
                >
                    <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''} transition-transform hover:scale-110`} />
                </button>
                {product.inStock && (
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-medium backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 delay-75 ${
                            isAdding
                                ? 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-glow scale-110'
                                : 'bg-white/90 text-neutral-700 hover:bg-primary-600 hover:text-white hover:shadow-glow'
                        }`}
                    >
                        <ShoppingBag className="w-5 h-5 transition-transform hover:scale-110" />
                    </button>
                )}
            </div>

            {/* Quick View Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
    );
}