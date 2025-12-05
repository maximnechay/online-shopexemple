// app/cart/recover/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/useCartStore';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function RecoverContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addItem, clearCart } = useCartStore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cart, setCart] = useState<any>(null);
    const [recovered, setRecovered] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setError('Ungültiger Recovery-Link');
            setLoading(false);
            return;
        }

        recoverCart(token);
    }, [searchParams]);

    const recoverCart = async (token: string) => {
        try {
            // Получить данные корзины
            const response = await fetch(`/api/abandoned-cart/recover?token=${token}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Fehler beim Wiederherstellen des Warenkorbs');
            }

            const data = await response.json();
            setCart(data.cart);
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleRestoreCart = async () => {
        if (!cart) return;

        try {
            // Очистить текущую корзину
            clearCart();

            // Добавить товары из брошенной корзины
            cart.items.forEach((item: any) => {
                const product: Product = {
                    id: item.product_id,
                    name: item.name,
                    slug: item.slug,
                    price: item.price,
                    images: item.image ? [item.image] : [],
                    description: '',
                    category: 'makeup' as any,
                    inStock: true,
                    stockQuantity: 10,
                    tags: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                addItem(product, item.quantity);
            });

            // Пометить корзину как восстановленную
            const token = searchParams.get('token');
            await fetch('/api/abandoned-cart/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            setRecovered(true);

            // Перенаправить в корзину через 2 секунды
            setTimeout(() => {
                router.push('/cart');
            }, 2000);
        } catch (err) {
            console.error('Error restoring cart:', err);
            setError('Fehler beim Wiederherstellen des Warenkorbs');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Warenkorb wird geladen...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Fehler
                    </h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        href="/catalog"
                        className="inline-block bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        Weiter einkaufen
                    </Link>
                </div>
            </div>
        );
    }

    if (recovered) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Erfolgreich wiederhergestellt! 🎉
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Ihr Warenkorb wurde wiederhergestellt. Sie werden weitergeleitet...
                    </p>
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-8 text-center">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold mb-2">
                            Willkommen zurück! 👋
                        </h1>
                        <p className="text-gray-200">
                            Ihre Produkte warten noch auf Sie
                        </p>
                    </div>

                    {/* Cart Items */}
                    <div className="p-8">
                        <h2 className="text-xl font-semibold mb-6">Ihr Warenkorb:</h2>

                        <div className="space-y-4 mb-8">
                            {cart?.items?.map((item: any, index: number) => (
                                <div key={index} className="flex gap-4 p-4 border border-gray-200 rounded-xl">
                                    {item.image && (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Menge: {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Coupon */}
                        {cart?.coupon_code && (
                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
                                <div className="flex items-start gap-3">
                                    <span className="text-3xl">🎁</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            Ihr exklusiver Gutschein!
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Verwenden Sie diesen Code für 10% Rabatt:
                                        </p>
                                        <div className="bg-white border-2 border-dashed border-yellow-400 rounded-lg px-4 py-2 inline-block">
                                            <code className="text-xl font-bold text-gray-900">
                                                {cart.coupon_code}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="border-t border-gray-200 pt-6 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-gray-600">
                                    Gesamt:
                                </span>
                                <span className="text-3xl font-bold text-gray-900">
                                    {formatPrice(cart?.total || 0)}
                                </span>
                            </div>
                            {cart?.coupon_code && (
                                <p className="text-sm text-green-600 mt-2 text-right">
                                    Mit Gutschein: {formatPrice((cart?.total || 0) * 0.9)}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleRestoreCart}
                                className="flex-1 bg-black text-white py-4 px-8 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Warenkorb wiederherstellen
                            </button>
                            <Link
                                href="/catalog"
                                className="flex-1 bg-gray-100 text-gray-900 py-4 px-8 rounded-full font-semibold hover:bg-gray-200 transition-colors text-center"
                            >
                                Weiter einkaufen
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <span>✓</span>
                            <span>Sichere Zahlung</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>✓</span>
                            <span>Kostenloser Versand ab €50</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>✓</span>
                            <span>30 Tage Rückgaberecht</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RecoverCartPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Laden...</p>
                </div>
            </div>
        }>
            <RecoverContent />
        </Suspense>
    );
}
