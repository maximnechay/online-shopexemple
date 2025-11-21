// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    ShoppingBag,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Package,
    CheckCircle2,
    Truck,
    Store,
    Banknote,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/lib/store/useCartStore';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface CheckoutFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    deliveryMethod: 'delivery' | 'pickup';
    paymentMethod: 'card' | 'cash';
    notes: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { user, loading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CheckoutFormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        deliveryMethod: 'delivery',
        paymentMethod: 'card',
        notes: '',
    });

    // Загружаем данные пользователя если залогинен
    useEffect(() => {
        const loadUserProfile = async () => {
            if (user) {
                try {
                    const supabase = createClient();

                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (error) {
                        console.error('Profile load error:', error);
                        // Используем данные из user.user_metadata если профиль не загрузился
                        const metadata = user.user_metadata || {};
                        setFormData(prev => ({
                            ...prev,
                            firstName: metadata.first_name || '',
                            lastName: metadata.last_name || '',
                            email: user.email || '',
                            phone: metadata.phone || '',
                        }));
                        return;
                    }

                    if (data) {
                        const fullName = data.full_name || '';
                        const [firstName = '', ...lastNameParts] = fullName.split(' ');
                        const lastName = lastNameParts.join(' ');

                        setFormData(prev => ({
                            ...prev,
                            firstName,
                            lastName,
                            email: data.email || user.email || '',
                            phone: data.phone || '',
                        }));
                    }
                } catch (err) {
                    console.error('Error loading profile:', err);
                }
            }
        };

        loadUserProfile();
    }, [user]);

    // Редирект если корзина пуста (только при первой загрузке, не во время оформления)
    useEffect(() => {
        if (items.length === 0 && !isSubmitting) {
            router.push('/cart');
        }
    }, [items.length, isSubmitting, router]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Подготавливаем данные заказа (как у тебя уже есть)
            const orderData: any = {
                userId: user?.id || null,
                customerName: `${formData.firstName} ${formData.lastName}`.trim(),
                customerEmail: formData.email,
                customerPhone: formData.phone,
                deliveryMethod: formData.deliveryMethod,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes || null,
                items: items.map(item => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    productPrice: item.product.price, // ВАЖНО: тут в € (20, 15 и тд)
                    quantity: item.quantity,
                })),
            };

            if (formData.deliveryMethod === 'delivery') {
                orderData.deliveryAddress = `${formData.street} ${formData.houseNumber}`;
                orderData.deliveryCity = formData.city;
                orderData.deliveryPostalCode = formData.postalCode;
            } else {
                orderData.deliveryAddress = 'Самовывоз';
                orderData.deliveryCity = 'Salon';
                orderData.deliveryPostalCode = '';
            }

            // 1) Если оплата НАЛИЧНЫМИ — как раньше
            if (formData.paymentMethod === 'cash') {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Fehler beim Erstellen der Bestellung');
                }

                window.location.href = `/order-success/${result.orderId}`;

                setTimeout(() => {
                    clearCart();
                }, 500);

                return;
            }

            // 2) Если оплата КАРТОЙ — идём через Stripe
            if (formData.paymentMethod === 'card') {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user?.id ?? null,
                        items: orderData.items,
                        deliveryMethod: orderData.deliveryMethod,
                        customer: {
                            name: orderData.customerName,
                            email: orderData.customerEmail,
                            phone: orderData.customerPhone,
                        },
                        address:
                            orderData.deliveryMethod === 'delivery'
                                ? {
                                    street: formData.street,
                                    houseNumber: formData.houseNumber,
                                    postalCode: formData.postalCode,
                                    city: formData.city,
                                }
                                : null,
                    }),

                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Fehler beim Starten der Zahlung');
                }

                // Stripe URL
                window.location.href = result.url;

                return;
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
            setIsSubmitting(false);
        }
    };


    const total = getTotal();
    const shipping = formData.deliveryMethod === 'delivery' ? 4.99 : 0;
    const finalTotal = total + shipping;

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Back Button */}
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zurück zum Warenkorb
                    </Link>

                    <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-12">
                        Kasse
                    </h1>

                    {/* Login Prompt для гостей */}
                    {!authLoading && !user && (
                        <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl">
                            <div className="flex items-start gap-4">
                                <User className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Haben Sie bereits ein Konto?
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Melden Sie sich an, um Ihre Bestellung zu verfolgen und Ihre
                                        Daten zu speichern.
                                    </p>
                                    <Link
                                        href={`/auth/login?redirect=/checkout`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors"
                                    >
                                        Jetzt anmelden
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Personal Information */}
                                <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <h2 className="text-2xl font-serif text-gray-900">
                                            Persönliche Daten
                                        </h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vorname *
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nachname *
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                E-Mail *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Telefon *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Method */}
                                <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                                            <Truck className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <h2 className="text-2xl font-serif text-gray-900">
                                            Liefermethode
                                        </h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                        <label
                                            className={`relative flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.deliveryMethod === 'delivery'
                                                ? 'border-rose-600 bg-rose-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="delivery"
                                                checked={formData.deliveryMethod === 'delivery'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <Truck className="w-6 h-6 text-gray-600" />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    Lieferung
                                                </div>
                                                <div className="text-sm text-gray-600">2-3 Werktage</div>
                                            </div>
                                            <div className="font-semibold text-gray-900">4,99 €</div>
                                        </label>

                                        <label
                                            className={`relative flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.deliveryMethod === 'pickup'
                                                ? 'border-rose-600 bg-rose-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="pickup"
                                                checked={formData.deliveryMethod === 'pickup'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <Store className="w-6 h-6 text-gray-600" />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    Abholung
                                                </div>
                                                <div className="text-sm text-gray-600">Im Salon</div>
                                            </div>
                                            <div className="font-semibold text-green-600">Kostenlos</div>
                                        </label>
                                    </div>

                                    {/* Address Fields - только для доставки */}
                                    {formData.deliveryMethod === 'delivery' && (
                                        <div className="space-y-4 pt-6 border-t border-gray-200">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Straße *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="street"
                                                        value={formData.street}
                                                        onChange={handleInputChange}
                                                        required={formData.deliveryMethod === 'delivery'}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Hausnummer *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="houseNumber"
                                                        value={formData.houseNumber}
                                                        onChange={handleInputChange}
                                                        required={formData.deliveryMethod === 'delivery'}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        PLZ *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="postalCode"
                                                        value={formData.postalCode}
                                                        onChange={handleInputChange}
                                                        required={formData.deliveryMethod === 'delivery'}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Stadt *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        required={formData.deliveryMethod === 'delivery'}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                                            <CreditCard className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <h2 className="text-2xl font-serif text-gray-900">
                                            Zahlungsmethode
                                        </h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <label
                                            className={`relative flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === 'card'
                                                ? 'border-rose-600 bg-rose-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={formData.paymentMethod === 'card'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <CreditCard className="w-6 h-6 text-gray-600" />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    Kreditkarte
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Visa, Mastercard
                                                </div>
                                            </div>
                                        </label>

                                        <label
                                            className={`relative flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === 'cash'
                                                ? 'border-rose-600 bg-rose-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cash"
                                                checked={formData.paymentMethod === 'cash'}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <Banknote className="w-6 h-6 text-gray-600" />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    Barzahlung
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Bei Lieferung/Abholung
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Anmerkungen (Optional)
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                                        placeholder="Besondere Wünsche oder Anmerkungen..."
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-rose-600 text-white py-4 rounded-xl font-medium hover:bg-rose-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Bestellung wird erstellt...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Zahlungspflichtig bestellen
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:sticky lg:top-24 h-fit">
                            <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <ShoppingBag className="w-6 h-6 text-rose-600" />
                                    <h2 className="text-2xl font-serif text-gray-900">
                                        Bestellübersicht
                                    </h2>
                                </div>

                                {/* Items */}
                                <div className="space-y-4 mb-6">
                                    {items.map(item => (
                                        <div key={item.product.id} className="flex gap-4">
                                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    {item.product.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {item.quantity}x {item.product.price.toFixed(2)} €
                                                </p>
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {(item.product.price * item.quantity).toFixed(2)} €
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="space-y-3 pt-6 border-t border-gray-300">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Zwischensumme</span>
                                        <span>{total.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Versandkosten</span>
                                        <span>
                                            {shipping === 0 ? 'Kostenlos' : `${shipping.toFixed(2)} €`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xl font-semibold text-gray-900 pt-3 border-t border-gray-300">
                                        <span>Gesamt</span>
                                        <span>{finalTotal.toFixed(2)} €</span>
                                    </div>
                                    <p className="text-xs text-gray-600">inkl. MwSt.</p>
                                </div>

                                {/* Trust Badges */}
                                <div className="mt-6 pt-6 border-t border-gray-300 space-y-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span>Sichere Zahlung</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span>14 Tage Rückgaberecht</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span>Schneller Versand</span>
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
