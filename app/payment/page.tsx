// app/payment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatPrice } from '@/lib/utils';

type PaymentPageProps = {
    searchParams: { [key: string]: string | string[] | undefined };
};

export default function PaymentPage({ searchParams }: PaymentPageProps) {
    const router = useRouter();

    // безопасно достаём значения из searchParams
    const getParam = (name: string): string | undefined => {
        const value = searchParams[name];
        if (Array.isArray(value)) return value[0];
        return value ?? undefined;
    };

    const totalParam = getParam('total');
    const methodParam = getParam('method') as 'card' | 'paypal' | 'invoice' | undefined;

    const total = Number.isNaN(parseInt(totalParam ?? '0', 10))
        ? 0
        : parseInt(totalParam ?? '0', 10);

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'invoice'>(
        methodParam ?? 'card'
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentError, setPaymentError] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');

    // если total == 0 → отправляем обратно на checkout (только на клиенте)
    useEffect(() => {
        if (total === 0) {
            router.push('/checkout');
        }
    }, [total, router]);

    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'number') {
            formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
            if (formattedValue.length > 19) return;
        }

        if (name === 'expiry') {
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length >= 2) {
                formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
            }
            if (formattedValue.length > 5) return;
        }

        if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length > 3) return;
        }

        setCardData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setPaymentError(false);

        // симуляция обработки платежа
        await new Promise(resolve => setTimeout(resolve, 3000));

        // симуляция успеха/неудачи (90% успех)
        const success = Math.random() > 0.1;

        if (success) {
            const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;
            setOrderNumber(orderNum);
            setPaymentSuccess(true);

            setTimeout(() => {
                router.push(`/order-success?order=${orderNum}`);
            }, 2000);
        } else {
            setPaymentError(true);
            setIsProcessing(false);
        }
    };

    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-serif text-gray-900 mb-4">
                        Zahlung erfolgreich!
                    </h2>
                    <p className="text-gray-600">
                        Sie werden weitergeleitet...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-40 md:pt-24 pb-16">
                <div className="max-w-3xl mx-auto px-6 lg:px-8">
                    {/* Back Button */}
                    <Link
                        href="/checkout"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zurück
                    </Link>

                    <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                                <Lock className="w-6 h-6 text-rose-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-serif text-gray-900">
                                    Sichere Zahlung
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Ihre Daten sind durch SSL-Verschlüsselung geschützt
                                </p>
                            </div>
                        </div>

                        {/* Payment Amount */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-8">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Zu zahlender Betrag:</span>
                                <span className="text-3xl font-bold text-gray-900">
                                    {formatPrice(total)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-4">
                                Zahlungsmethode
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-4 border-2 rounded-xl text-center transition-all ${paymentMethod === 'card'
                                        ? 'border-rose-600 bg-rose-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">Karte</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('paypal')}
                                    className={`p-4 border-2 rounded-xl text-center transition-all ${paymentMethod === 'paypal'
                                        ? 'border-rose-600 bg-rose-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="w-6 h-6 bg-blue-600 rounded mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold">
                                        P
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">PayPal</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('invoice')}
                                    className={`p-4 border-2 rounded-xl text-center transition-all ${paymentMethod === 'invoice'
                                        ? 'border-rose-600 bg-rose-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="w-6 h-6 bg-gray-600 rounded mx-auto mb-2" />
                                    <span className="text-sm font-medium text-gray-900">Rechnung</span>
                                </button>
                            </div>
                        </div>

                        {/* Payment Forms */}
                        <form onSubmit={handlePayment}>
                            {/* Card Payment */}
                            {paymentMethod === 'card' && (
                                <div className="space-y-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kartennummer *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="number"
                                                value={cardData.number}
                                                onChange={handleCardInputChange}
                                                required
                                                placeholder="1234 5678 9012 3456"
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Karteninhaber *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={cardData.name}
                                            onChange={handleCardInputChange}
                                            required
                                            placeholder="Max Mustermann"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Gültig bis *
                                            </label>
                                            <input
                                                type="text"
                                                name="expiry"
                                                value={cardData.expiry}
                                                onChange={handleCardInputChange}
                                                required
                                                placeholder="MM/YY"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                CVV *
                                            </label>
                                            <input
                                                type="text"
                                                name="cvv"
                                                value={cardData.cvv}
                                                onChange={handleCardInputChange}
                                                required
                                                placeholder="123"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PayPal */}
                            {paymentMethod === 'paypal' && (
                                <div className="bg-blue-50 rounded-xl p-8 mb-8 text-center">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-white text-2xl font-bold">P</span>
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        PayPal Zahlung
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Sie werden zu PayPal weitergeleitet, um die Zahlung abzuschließen.
                                    </p>
                                </div>
                            )}

                            {/* Invoice */}
                            {paymentMethod === 'invoice' && (
                                <div className="bg-gray-50 rounded-xl p-8 mb-8">
                                    <h3 className="text-xl font-medium text-gray-900 mb-4">
                                        Kauf auf Rechnung
                                    </h3>
                                    <div className="space-y-3 text-sm text-gray-600">
                                        <p>✓ Zahlung innerhalb von 14 Tagen</p>
                                        <p>✓ Keine zusätzlichen Gebühren</p>
                                        <p>✓ Rechnung wird per E-Mail zugestellt</p>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {paymentError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-red-900 mb-1">
                                            Zahlung fehlgeschlagen
                                        </h4>
                                        <p className="text-sm text-red-700">
                                            Die Zahlung konnte nicht verarbeitet werden. Bitte überprüfen Sie Ihre Angaben und versuchen Sie es erneut.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full bg-rose-600 text-white py-4 rounded-xl font-medium hover:bg-rose-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Zahlung wird verarbeitet...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        Jetzt zahlen {formatPrice(total)}
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Durch Klick auf "Jetzt zahlen" bestätigen Sie die Zahlungsabwicklung
                            </p>
                        </form>
                    </div>

                    {/* Security Info */}
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-xl p-4">
                            <Lock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">SSL-verschlüsselt</p>
                        </div>
                        <div className="bg-white rounded-xl p-4">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">PCI DSS konform</p>
                        </div>
                        <div className="bg-white rounded-xl p-4">
                            <Lock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">Käuferschutz</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
