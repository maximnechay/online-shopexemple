'use client';

import Link from 'next/link';
import { ShoppingBag, Heart, ArrowRight, Sparkles, Star, Eye } from 'lucide-react';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { Product } from '@/lib/types';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { addToCart as trackAddToCart } from '@/lib/analytics'; // ⭐ GA4
import { useState } from 'react';
import { useReviewStats } from '@/lib/contexts/ReviewStatsContext';
import { useQuickView } from '@/lib/contexts/QuickViewContext';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
    const { addItem: addToCart } = useCartStore();
    const [isAdding, setIsAdding] = useState(false);
    const { getStats } = useReviewStats();
    const { openQuickView } = useQuickView();

    const inWishlist = isInWishlist(product.id);
    const reviewStats = getStats(product.id) || { average: 0, total: 0 };

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

        // ⭐ Добавьте console.log для проверки:
        console.log('🛒 Adding to cart:', product);
        if (typeof window.gtag !== 'undefined') {
            console.log('✅ Tracking add_to_cart');
            trackAddToCart(product, 1);
        } else {
            console.log('❌ gtag not available');
        }

        setTimeout(() => setIsAdding(false), 1000);
    };

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault();
        openQuickView(product);
    };

    return (
        <Link
            href={`/product/${product.slug}`}
            className="group rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 flex flex-col shadow-sm hover:shadow-md transition-all"
        >
            <div className="aspect-[4/5] rounded-2xl bg-gray-50 mb-4 overflow-hidden relative">
                {product.images && product.images.length > 0 ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${product.images[0]})` }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-gray-300">No image</div>
                    </div>
                )}

                {/* Discount Badge */}
                {discount > 0 && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                        <span>-{discount}%</span>
                    </div>
                )}

                {/* New/Featured Badge */}
                {product.featured && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                        <Sparkles className="w-3 h-3" />
                        <span>Neu</span>
                    </div>
                )}

                {/* Stock Status */}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">Ausverkauft</span>
                    </div>
                )}

                {/* Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button
                        onClick={handleWishlistToggle}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 ${inWishlist
                            ? 'bg-black text-white'
                            : 'bg-white/90 hover:bg-black hover:text-white text-gray-900'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} strokeWidth={1.5} />
                    </button>
                    {product.inStock && (
                        <button
                            onClick={handleAddToCart}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 ${isAdding
                                ? 'bg-green-600 text-white'
                                : 'bg-white/90 hover:bg-black hover:text-white text-gray-900'
                                }`}
                        >
                            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                    )}
                </div>

                {/* Quick View Button - Centered */}
                <button
                    onClick={handleQuickView}
                    className="absolute inset-x-0 bottom-4 mx-auto w-[calc(100%-2rem)] h-12 rounded-full bg-white/95 hover:bg-black hover:text-white text-gray-900 font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                >
                    <Eye className="w-4 h-4" strokeWidth={2} />
                    Schnellansicht
                </button>
            </div>

            <div className="flex-1 flex flex-col gap-1">
                {/* Brand */}
                {product.brand && (
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{product.brand}</p>
                )}

                {/* Name */}
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                </h3>

                {/* Size */}
                {product.size && <p className="text-xs text-gray-500 mb-2">{product.size}</p>}

                {/* Price */}
                <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {product.maxPrice && product.maxPrice !== product.price ? (
                            // Диапазон цен для товаров с вариантами
                            <span className="text-base font-medium text-gray-900">
                                {formatPrice(product.price)} – {formatPrice(product.maxPrice)}
                            </span>
                        ) : (
                            // Одна цена
                            <>
                                <span className="text-base font-medium text-gray-900">
                                    {formatPrice(product.price)}
                                </span>
                                {product.compareAtPrice && (
                                    <span className="text-xs text-gray-400 line-through">
                                        {formatPrice(product.compareAtPrice)}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 flex items-center gap-1">
                        Details
                        <ArrowRight className="w-3 h-3" strokeWidth={2} />
                    </span>
                </div>

                {/* Rating */}
                {reviewStats.total > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < Math.floor(reviewStats.average)
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-600">
                            {reviewStats.average.toFixed(1)} ({reviewStats.total})
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}