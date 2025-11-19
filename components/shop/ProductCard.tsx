// components/shop/ProductCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart } from 'lucide-react';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { Product } from '@/lib/types';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const discount = product.compareAtPrice
        ? calculateDiscount(product.price, product.compareAtPrice)
        : 0;

    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden transition-all hover:shadow-xl">
            <Link href={`/product/${product.slug}`}> {/* ← Правильная ссылка */}
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundImage: `url(${product.images[0]})` }}
                    />

                    {/* Discount Badge */}
                    {discount > 0 && (
                        <div className="absolute top-4 left-4 bg-rose-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                            -{discount}%
                        </div>
                    )}

                    {/* Stock Status */}
                    {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-medium text-lg">Ausverkauft</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-4">
                    {/* Brand */}
                    {product.brand && (
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            {product.brand}
                        </p>
                    )}

                    {/* Name */}
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {product.name}
                    </h3>

                    {/* Price */}
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

                    {/* Rating */}
                    {product.rating && (
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-amber-400">★</span>
                            <span className="text-sm text-gray-600">
                                {product.rating} ({product.reviewCount || 0})
                            </span>
                        </div>
                    )}
                </div>
            </Link>

            {/* Actions - Outside Link */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                        e.preventDefault();
                        // TODO: Add to wishlist
                    }}
                >
                    <Heart className="w-5 h-5" />
                </button>
                {product.inStock && (
                    <button
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                            e.preventDefault();
                            // TODO: Add to cart
                        }}
                    >
                        <ShoppingBag className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}