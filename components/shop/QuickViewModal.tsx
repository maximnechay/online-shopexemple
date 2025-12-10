// components/shop/QuickViewModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingBag, Heart, ChevronLeft, ChevronRight, Star, Info } from 'lucide-react';
import { useQuickView } from '@/lib/contexts/QuickViewContext';
import { useCartStore } from '@/lib/store/useCartStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useReviewStats } from '@/lib/contexts/ReviewStatsContext';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { addToCart as trackAddToCart } from '@/lib/analytics';
import Link from 'next/link';

export default function QuickViewModal() {
    const { product, isOpen, closeQuickView } = useQuickView();
    const { addItem: addToCart } = useCartStore();
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
    const { getStats } = useReviewStats();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<string>('');

    // Сброс состояния при открытии нового продукта
    useEffect(() => {
        if (product) {
            setCurrentImageIndex(0);
            setQuantity(1);
            setSelectedVariant('');
        }
    }, [product]);

    // Закрытие по ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeQuickView();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, closeQuickView]);

    if (!isOpen || !product) return null;

    const inWishlist = isInWishlist(product.id);
    const discount = product.compareAtPrice ? calculateDiscount(product.price, product.compareAtPrice) : 0;
    const images = product.images || [];

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleAddToCart = () => {
        if (!product.inStock) return;

        setIsAdding(true);
        addToCart(product as any, quantity);

        if (typeof window.gtag !== 'undefined') {
            trackAddToCart(product, quantity);
        }

        setTimeout(() => {
            setIsAdding(false);
            closeQuickView();
        }, 800);
    };

    const handleWishlistToggle = () => {
        if (inWishlist) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product as any);
        }
    };

    // Варианты товара (можно расширить для цветов, размеров и т.д.)
    const variants = product.attributes?.filter(attr =>
        attr.name.toLowerCase() === 'size' ||
        attr.name.toLowerCase() === 'color' ||
        attr.name.toLowerCase() === 'volume'
    ) || [];

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                onClick={closeQuickView}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeQuickView}
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-black hover:text-white flex items-center justify-center transition-all shadow-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
                        {/* Left: Image Gallery */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden relative group">
                                {images.length > 0 ? (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                                            style={{ backgroundImage: `url(${images[currentImageIndex]})` }}
                                        />

                                        {/* Navigation Arrows */}
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePrevImage}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-black hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-black hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}

                                        {/* Discount Badge */}
                                        {discount > 0 && (
                                            <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                                                -{discount}%
                                            </div>
                                        )}

                                        {/* Stock Status */}
                                        {!product.inStock && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white font-medium">Ausverkauft</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        No image
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {images.length > 1 && (
                                <div className="grid grid-cols-5 gap-2">
                                    {images.map((image, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex
                                                ? 'border-black'
                                                : 'border-transparent hover:border-gray-300'
                                                }`}
                                        >
                                            <div
                                                className="w-full h-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${image})` }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Product Info */}
                        <div className="flex flex-col gap-6">
                            {/* Brand */}
                            {product.brand && (
                                <p className="text-sm uppercase tracking-[0.18em] text-gray-500">
                                    {product.brand}
                                </p>
                            )}

                            {/* Name */}
                            <h2 className="text-3xl font-medium text-gray-900">
                                {product.name}
                            </h2>

                            {/* Size */}
                            {product.size && (
                                <p className="text-sm text-gray-600">{product.size}</p>
                            )}

                            {/* Rating */}
                            {(() => {
                                const reviewStats = getStats(product.id) || { average: 0, total: 0 };
                                return reviewStats.total > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${i < Math.floor(reviewStats.average)
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {reviewStats.average.toFixed(1)} ({reviewStats.total} Bewertungen)
                                        </span>
                                    </div>
                                );
                            })()}

                            {/* Price */}
                            <div className="flex items-center gap-3">
                                {product.maxPrice && product.maxPrice !== product.price ? (
                                    <span className="text-3xl font-medium text-gray-900">
                                        {formatPrice(product.price)} – {formatPrice(product.maxPrice)}
                                    </span>
                                ) : (
                                    <>
                                        <span className="text-3xl font-medium text-gray-900">
                                            {formatPrice(product.price)}
                                        </span>
                                        {product.compareAtPrice && (
                                            <span className="text-lg text-gray-400 line-through">
                                                {formatPrice(product.compareAtPrice)}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-600 leading-relaxed line-clamp-4">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Variants */}
                            {variants.length > 0 && (
                                <div className="space-y-3">
                                    {variants.map((variant, idx) => (
                                        <div key={idx}>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {variant.name}
                                            </label>
                                            <select
                                                value={selectedVariant}
                                                onChange={(e) => setSelectedVariant(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            >
                                                <option value="">Wählen Sie {variant.name}</option>
                                                <option value={variant.value}>{variant.value}</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Menge
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-lg border border-gray-300 hover:border-black flex items-center justify-center transition-all"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-16 h-10 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        min="1"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 rounded-lg border border-gray-300 hover:border-black flex items-center justify-center transition-all"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Stock Info */}
                            {product.inStock && product.stockQuantity && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Info className="w-4 h-4" />
                                    <span>Noch {product.stockQuantity} auf Lager</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.inStock}
                                    className={`flex-1 h-14 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${isAdding
                                        ? 'bg-green-600 text-white'
                                        : product.inStock
                                            ? 'bg-black text-white hover:bg-gray-800'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    {isAdding ? 'Hinzugefügt!' : 'In den Warenkorb'}
                                </button>

                                <button
                                    onClick={handleWishlistToggle}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${inWishlist
                                        ? 'bg-black text-white'
                                        : 'border border-gray-300 hover:border-black'
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            {/* View Full Details Link */}
                            <Link
                                href={`/product/${product.slug}`}
                                onClick={closeQuickView}
                                className="text-center text-sm text-gray-600 hover:text-black transition-colors underline"
                            >
                                Alle Details anzeigen
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                    @keyframes scale-in {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    .animate-scale-in {
                        animation: scale-in 0.2s ease-out;
                    }
                `}</style>
        </>
    );
}
