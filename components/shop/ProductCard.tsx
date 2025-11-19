// components/shop/ProductCard.tsx
'use client';

import Link from 'next/link';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/store/useCartStore';
import { useState } from 'react';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);
    const [isAdding, setIsAdding] = useState(false);

    const discount = product.compareAtPrice
        ? calculateDiscount(product.price, product.compareAtPrice)
        : 0;

    const handleAddToCart = () => {
        setIsAdding(true);
        addItem(product);

        setTimeout(() => {
            setIsAdding(false);
        }, 500);
    };

    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all duration-300">
            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {discount > 0 && (
                    <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        -{discount}%
                    </span>
                )}
                {!product.inStock && (
                    <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Ausverkauft
                    </span>
                )}
            </div>

            {/* Wishlist Button */}
            <button className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-50">
                <Heart className="w-5 h-5 text-gray-600 hover:text-rose-600" />
            </button>

            {/* Image */}
            <Link href={`/product/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gray-50">
                <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${product.images[0]})` }}
                />
            </Link>

            {/* Content */}
            <div className="p-4">
                {/* Brand */}
                {product.brand && (
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                        {product.brand}
                    </p>
                )}

                {/* Title */}
                <Link href={`/product/${product.slug}`}>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {/* Rating */}
                {product.rating && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-medium text-gray-900">
                                {product.rating}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500">
                            ({product.reviewCount})
                        </span>
                    </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                            {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && (
                            <span className="text-sm text-gray-400 line-through">
                                {formatPrice(product.compareAtPrice)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Add to Cart Button */}
                <button
                    disabled={!product.inStock || isAdding}
                    onClick={handleAddToCart}
                    className={`w-full py-3 rounded-xl font-medium transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isAdding
                            ? 'bg-green-600 text-white'
                            : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                >
                    <ShoppingBag className="w-5 h-5" />
                    {isAdding ? 'Hinzugefügt!' : product.inStock ? 'In den Warenkorb' : 'Nicht verfügbar'}
                </button>
            </div>
        </div>
    );
}