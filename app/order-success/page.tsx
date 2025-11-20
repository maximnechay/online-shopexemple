// app/order-success/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Mail, Download, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('order') || 'ORD-UNKNOWN';

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-3xl mx-auto px-6 lg:px-8">
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                            Bestellung erfolgreich!
                        </h1>

                        <p className="text-lg text-gray-600 mb-2">
                            Vielen Dank für Ihre Bestellung bei Élégance
                        </p>

                        <div className="inline-block bg-rose-50 px-6 py-3 rounded-full mb-8">
                            <p className="text-sm text-gray-600">Bestellnummer</p>
                            <p className="text-2xl font-bold text-rose-600">{orderNumber}</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 mb-8 text-left max-w-2xl mx-auto">
                            <h2 className="text-2xl font-serif text-gray-900 mb-6 text-center">
                                Was passiert jetzt?
                            </h2>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-6 h-6 text-rose-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 mb-1">
                                            Bestätigung per E-Mail
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Sie erhalten in Kürze eine Bestellbestätigung mit allen Details per E-Mail.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Package className="w-6 h-6 text-rose-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 mb-1">
                                            Vorbereitung & Versand
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Wir bereiten Ihre Bestellung sorgfältig vor und versenden sie innerhalb von 1-2 Werktagen.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-6 h-6 text-rose-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 mb-1">
                                            Sendungsverfolgung
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Sobald Ihr Paket versendet wurde, erhalten Sie eine Tracking-Nummer per E-Mail.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link
                                href="/catalog"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-full font-medium hover:bg-rose-700 transition-all"
                            >
                                Weiter einkaufen
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:border-gray-400 transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Rechnung drucken
                            </button>
                        </div>

                        <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-8">
                            <h3 className="text-xl font-serif text-gray-900 mb-2">
                                Brauchen Sie Hilfe?
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Unser Kundenservice steht Ihnen gerne zur Verfügung
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center text-sm">
                                <a href="tel:+4930123456789" className="text-rose-600 hover:text-rose-700 font-medium">
                                    +49 (30) 123 456 789
                                </a>
                                <span className="text-gray-400">•</span>
                                <a
                                    href="mailto:support@elegance-beauty.de"
                                    className="text-rose-600 hover:text-rose-700 font-medium"
                                >
                                    support@elegance-beauty.de
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function OrderSuccessPageWrapper() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <p className="text-gray-600">Lädt...</p>
                </div>
            }
        >
            <OrderSuccessContent />
        </Suspense>
    );
}
