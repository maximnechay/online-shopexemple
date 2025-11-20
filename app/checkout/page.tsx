// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Truck, Package, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function CheckoutPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { items, getTotal, clearCart } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [isReady, setIsReady] = useState(false);

    const total = getTotal();
    const shipping = total > 5000 ? 0 : 490;
    const finalTotal = total + shipping;

    const [formData, setFormData] = useState({
        // Persönliche Daten
        firstName: '',
        lastName: '',
        email: '',
        phone: '',

        // Adresse
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',

        // Lieferung & Zahlung
        deliveryMethod: 'standard' as 'standard' | 'express' | 'pickup',
        paymentMethod: 'card' as 'card' | 'paypal' | 'invoice',

        // Zusätzlich
        notes: '',
        newsletter: false,
    });

    // Автозаполнение данных пользователя
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.user_metadata?.first_name || '',
                lastName: user.user_metadata?.last_name || '',
                email: user.email || '',
                phone: user.user_metadata?.phone || '',
                street: user.user_metadata?.street || '',
                houseNumber: user.user_metadata?.house_number || '',
                postalCode: user.user_metadata?.postal_code || '',
                city: user.user_metadata?.city || '',
            }));
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Симуляция проверки данных
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitting(false);

        // Редирект на страницу оплаты
        const totalWithShipping = total +
            (formData.deliveryMethod === 'pickup' ? 0 :
                formData.deliveryMethod === 'express' ? 990 : shipping);

        router.push(`/payment?total=${totalWithShipping}&method=${formData.paymentMethod}`);
    };

    useEffect(() => {
        if (items.length === 0 && !orderComplete) {
            router.replace('/cart');
        } else {
            setIsReady(true);
        }
    }, [items.length, orderComplete, router]);

    if (!isReady && !orderComplete) {
        // можно показать лоадер, а можно просто null
        return null;
    }

    // Страница успешного заказа
    if (orderComplete) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="pt-24 pb-16">
                    <div className="max-w-3xl mx-auto px-6 lg:px-8">
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h1 className="text-4xl font-serif text-gray-900 mb-4">
                                Vielen Dank für Ihre Bestellung!
                            </h1>
                            <p className="text-lg text-gray-600 mb-2">
                                Ihre Bestellung wurde erfolgreich aufgegeben.
                            </p>
                            <p className="text-2xl font-bold text-rose-600 mb-8">
                                Bestellnummer: {orderNumber}
                            </p>
                            <div className="bg-gray-50 rounded-2xl p-8 mb-8 text-left">
                                <h2 className="text-xl font-serif text-gray-900 mb-4">Was passiert jetzt?</h2>
                                <ul className="space-y-3 text-gray-600">
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-rose-600">1</span>
                                        </div>
                                        <span>Sie erhalten eine Bestätigungs-E-Mail an <strong>{formData.email}</strong></span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-rose-600">2</span>
                                        </div>
                                        <span>Wir bereiten Ihre Bestellung vor und versenden sie innerhalb von 1-2 Werktagen</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-rose-600">3</span>
                                        </div>
                                        <span>Sie erhalten eine Versandbestätigung mit Tracking-Nummer</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/catalog"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-full font-medium hover:bg-rose-700 transition-all"
                                >
                                    Weiter einkaufen
                                </Link>
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:border-gray-400 transition-all"
                                >
                                    Zur Startseite
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
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

                    <form onSubmit={handleSubmit}>
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Form */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Persönliche Daten */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                    <h2 className="text-2xl font-serif text-gray-900 mb-6">
                                        Persönliche Daten
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-4">
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Lieferadresse */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                    <h2 className="text-2xl font-serif text-gray-900 mb-6">
                                        Lieferadresse
                                    </h2>
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Straße *
                                            </label>
                                            <input
                                                type="text"
                                                name="street"
                                                value={formData.street}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nr. *
                                            </label>
                                            <input
                                                type="text"
                                                name="houseNumber"
                                                value={formData.houseNumber}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                PLZ *
                                            </label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Stadt *
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Versandart */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                    <h2 className="text-2xl font-serif text-gray-900 mb-6">
                                        Versandart
                                    </h2>
                                    <div className="space-y-3">
                                        <label className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors has-[:checked]:border-rose-600 has-[:checked]:bg-rose-50">
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="standard"
                                                checked={formData.deliveryMethod === 'standard'}
                                                onChange={handleInputChange}
                                                className="mt-1 w-4 h-4 text-rose-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-900">Standard Versand</span>
                                                    <span className="font-bold text-gray-900">
                                                        {shipping === 0 ? 'Kostenlos' : formatPrice(shipping)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">Lieferung in 2-3 Werktagen</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors has-[:checked]:border-rose-600 has-[:checked]:bg-rose-50">
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="express"
                                                checked={formData.deliveryMethod === 'express'}
                                                onChange={handleInputChange}
                                                className="mt-1 w-4 h-4 text-rose-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-900">Express Versand</span>
                                                    <span className="font-bold text-gray-900">{formatPrice(990)}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">Lieferung am nächsten Werktag</p>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors has-[:checked]:border-rose-600 has-[:checked]:bg-rose-50">
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="pickup"
                                                checked={formData.deliveryMethod === 'pickup'}
                                                onChange={handleInputChange}
                                                className="mt-1 w-4 h-4 text-rose-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-900">Abholung im Salon</span>
                                                    <span className="font-bold text-gray-900">Kostenlos</span>
                                                </div>
                                                <p className="text-sm text-gray-600">Abholbereit in 1-2 Werktagen</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Zahlungsart */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                    <h2 className="text-2xl font-serif text-gray-900 mb-6">
                                        Zahlungsart
                                    </h2>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors has-[:checked]:border-rose-600 has-[:checked]:bg-rose-50">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={formData.paymentMethod === 'card'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-rose-600"
                                            />
                                            <CreditCard className="w-6 h-6 text-gray-400" />
                                            <span className="font-medium text-gray-900">Kreditkarte / Debitkarte</span>
                                        </label>

                                        <label className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors has-[:checked]:border-rose-600 has-[:checked]:bg-rose-50">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="paypal"
                                                checked={formData.paymentMethod === 'paypal'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-rose-600"
                                            />
                                            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                                                P
                                            </div>
                                            <span className="font-medium text-gray-900">PayPal</span>
                                        </label>

                                        <label className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-rose-300 transition-colors has-[:checked]:border-rose-600 has-[:checked]:bg-rose-50">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="invoice"
                                                checked={formData.paymentMethod === 'invoice'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-rose-600"
                                            />
                                            <Package className="w-6 h-6 text-gray-400" />
                                            <span className="font-medium text-gray-900">Kauf auf Rechnung</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Anmerkungen */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Anmerkungen (optional)
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Z.B. Lieferhinweise, Geschenkverpackung, etc."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Newsletter */}
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="newsletter"
                                        checked={formData.newsletter}
                                        onChange={handleInputChange}
                                        className="mt-1 w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Ich möchte den Newsletter abonnieren und über Neuheiten und exklusive Angebote informiert werden.
                                    </span>
                                </label>
                            </div>

                            {/* Order Summary - Sticky */}
                            <div className="lg:col-span-1">
                                <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
                                    <h2 className="text-2xl font-serif text-gray-900 mb-6">
                                        Ihre Bestellung
                                    </h2>

                                    {/* Items */}
                                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                                        {items.map((item) => (
                                            <div key={item.product.id} className="flex gap-3">
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center"
                                                        style={{ backgroundImage: `url(${item.product.images[0]})` }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                        {item.product.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {item.quantity}x {formatPrice(item.product.price)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div className="space-y-3 mb-6 pt-6 border-t border-gray-300">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Zwischensumme</span>
                                            <span className="font-medium">{formatPrice(total)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Versand</span>
                                            <span className="font-medium">
                                                {formData.deliveryMethod === 'pickup' ? 'Kostenlos' :
                                                    formData.deliveryMethod === 'express' ? formatPrice(990) :
                                                        shipping === 0 ? 'Kostenlos' : formatPrice(shipping)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-300">
                                            <span>Gesamt</span>
                                            <span>
                                                {formatPrice(
                                                    total +
                                                    (formData.deliveryMethod === 'pickup' ? 0 :
                                                        formData.deliveryMethod === 'express' ? 990 : shipping)
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">Inkl. MwSt.</p>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-rose-600 text-white py-4 rounded-xl font-medium hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Wird bearbeitet...' : 'Jetzt kaufen'}
                                    </button>

                                    <p className="text-xs text-gray-500 text-center mt-4">
                                        Mit dem Klick auf "Jetzt kaufen" akzeptieren Sie unsere AGB
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}