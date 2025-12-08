'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Heart, Star, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/store/useCartStore';
import { Product } from '@/lib/types';
import { ProductAttribute } from '@/lib/types/attributes';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import ProductReviews from '@/components/product/ProductReviews';
import VariantSelector from '@/components/product/VariantSelector';
import { useReviewStats } from '@/lib/contexts/ReviewStatsContext';

export default function ProductPage() { // ← Убрали params из пропсов
    const params = useParams(); // ← Используем useParams hook
    const slug = params.slug as string; // ← Получаем slug

    const [product, setProduct] = useState<Product | null>(null);
    const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
    const [productVariants, setProductVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { getStats, loadStats } = useReviewStats();

    const addItem = useCartStore((state) => state.addItem);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchProduct();
        }
    }, [slug]);

    useEffect(() => {
        if (product?.id) {
            loadStats([product.id]);
        }
    }, [product?.id]);

    const fetchProduct = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch(`/api/products/${slug}`);
            if (!response.ok) {
                if (response.status === 404) {
                    notFound();
                }
                throw new Error('Failed to fetch product');
            }
            const data = await response.json();
            setProduct(data);

            // Load product attributes using slug
            try {
                const attrsResponse = await fetch(`/api/products/${slug}/attributes`);
                if (attrsResponse.ok) {
                    const attrsData = await attrsResponse.json();
                    setProductAttributes(attrsData);
                }
            } catch (err) {
                console.error('Error fetching product attributes:', err);
            }

            // Load product variants
            try {
                const variantsResponse = await fetch(`/api/products/${slug}/variants`);
                if (variantsResponse.ok) {
                    const variantsData = await variantsResponse.json();
                    setProductVariants(variantsData.variants || []);
                }
            } catch (err) {
                console.error('Error fetching product variants:', err);
            }
        } catch (err) {
            console.error('Error fetching product:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
    const inWishlist = product ? isInWishlist(product.id) : false;

    const handleWishlistToggle = () => {
        if (!product) return;
        if (inWishlist) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product as any);
        }
    };
    const handleAddToCart = () => {
        if (!product) return;
        setIsAdding(true);
        addItem(product as any, quantity);

        setTimeout(() => {
            setIsAdding(false);
        }, 1000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <main className="flex-1 pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
                            <div className="grid lg:grid-cols-2 gap-12">
                                <div className="aspect-square bg-gray-200 rounded-2xl" />
                                <div className="space-y-4">
                                    <div className="h-12 bg-gray-200 rounded w-3/4" />
                                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                                    <div className="h-24 bg-gray-200 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <main className="flex-1 pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center py-16">
                        <h1 className="text-3xl font-serif text-gray-900 mb-4">
                            Produkt nicht gefunden
                        </h1>
                        <Link
                            href="/catalog"
                            className="inline-block px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                        >
                            Zurück zum Katalog
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const discount = product.compareAtPrice
        ? calculateDiscount(product.price, product.compareAtPrice)
        : 0;

    const reviewStats = product ? getStats(product.id) || { average: 0, total: 0 } : { average: 0, total: 0 };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                        <Link href="/" className="hover:text-gray-900 transition-colors">
                            Startseite
                        </Link>
                        <span>/</span>
                        <Link href="/catalog" className="hover:text-gray-900 transition-colors">
                            Katalog
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">{product.name}</span>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 mb-16">
                        {/* Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${product.images[selectedImage]})` }}
                                />
                                {discount > 0 && (
                                    <span className="absolute top-4 left-4 bg-black/80 text-white text-xs font-medium px-4 py-2 rounded-full uppercase tracking-wider">
                                        -{discount}%
                                    </span>
                                )}

                                {/* Image Counter */}
                                {product.images.length > 1 && (
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
                                        {selectedImage + 1} / {product.images.length}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails - Always show if there are images */}
                            {product.images.length > 1 && (
                                <div className={`grid gap-4 ${product.images.length === 2
                                    ? 'grid-cols-2'
                                    : product.images.length === 3
                                        ? 'grid-cols-3'
                                        : 'grid-cols-4'
                                    }`}>
                                    {product.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === index
                                                ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                                                : 'border-gray-200 hover:border-gray-400'
                                                }`}
                                        >
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{ backgroundImage: `url(${image})` }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            {/* Brand */}
                            {product.brand && (
                                <p className="text-xs text-gray-500 uppercase tracking-[0.18em]">
                                    {product.brand}
                                </p>
                            )}

                            {/* Title */}
                            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 tracking-tight">
                                {product.name}
                            </h1>

                            {/* Rating */}
                            {reviewStats.total > 0 && (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
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
                            )}

                            {/* Price */}
                            <div className="flex items-center gap-4">
                                <span className="text-4xl font-bold text-gray-900">
                                    {formatPrice(product.price)}
                                </span>
                                {product.compareAtPrice && (
                                    <span className="text-2xl text-gray-400 line-through">
                                        {formatPrice(product.compareAtPrice)}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {product.description}
                            </p>

                            {/* Stock Status */}
                            <div className="flex items-center gap-2">
                                {product.inStock ? (
                                    <>
                                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                                        <span className="text-sm text-green-700 font-medium">
                                            Auf Lager ({product.stockQuantity} verfügbar)
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                                        <span className="text-sm text-red-700 font-medium">
                                            Ausverkauft
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Variant Selector */}
                            {productVariants.length > 0 && product && (
                                <VariantSelector
                                    currentProductId={product.id}
                                    variants={productVariants}
                                    variantAttributeSlug="volumen"
                                />
                            )}

                            {/* Quantity Selector */}
                            {product.inStock && (
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-700">Menge:</span>
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="p-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="px-6 py-2 font-medium min-w-[60px] text-center">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                                            className="p-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    disabled={!product.inStock || isAdding}
                                    onClick={handleAddToCart}
                                    className={`flex-1 py-4 rounded-full font-medium transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${isAdding
                                        ? 'bg-green-600 text-white'
                                        : 'bg-black text-white hover:bg-gray-800'
                                        }`}
                                >
                                    <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                                    {isAdding ? 'Hinzugefügt!' : 'In den Warenkorb'}
                                </button>
                                <button
                                    onClick={handleWishlistToggle}
                                    className={`w-14 h-14 border-2 rounded-full flex items-center justify-center transition-colors ${inWishlist
                                        ? 'bg-black border-black text-white'
                                        : 'border-gray-200 hover:border-black hover:bg-black hover:text-white'
                                        }`}
                                >
                                    <Heart
                                        className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                                <div className="text-center">
                                    <Truck className="w-7 h-7 text-gray-900 mx-auto mb-2" strokeWidth={1.5} />
                                    <p className="text-xs text-gray-600">Kostenloser Versand ab 50€</p>
                                </div>
                                <div className="text-center">
                                    <Shield className="w-7 h-7 text-gray-900 mx-auto mb-2" strokeWidth={1.5} />
                                    <p className="text-xs text-gray-600">100% Original Garantie</p>
                                </div>
                                <div className="text-center">
                                    <RotateCcw className="w-7 h-7 text-gray-900 mx-auto mb-2" strokeWidth={1.5} />
                                    <p className="text-xs text-gray-600">14 Tage Rückgaberecht</p>
                                </div>
                            </div>

                            {/* Product Attributes */}
                            {productAttributes.length > 0 && (
                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wider">
                                        Produkteigenschaften
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {productAttributes
                                            .filter(attr => attr.attribute?.visibleInCatalog !== false)
                                            .map((attr) => (
                                                <div key={attr.id} className="flex flex-col">
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                                        {attr.attribute?.name}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {attr.attributeValue?.value || attr.customValue || '—'}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-200">
                                    {product.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <ProductReviews
                    productId={product.id}
                    productName={product.name}
                />
            </main>

            <Footer />
        </div>
    );
}