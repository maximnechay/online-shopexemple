// app/contacts/page.tsx
'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ContactsPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Симуляция отправки
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitted(true);
        setIsSubmitting(false);

        // Сброс формы через 3 секунды
        setTimeout(() => {
            setFormData({ name: '', email: '', subject: '', message: '' });
            setIsSubmitted(false);
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                {/* Hero */}
                <section className="px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto text-center">
                        <h1 className="text-5xl lg:text-6xl font-serif font-light text-gray-900 mb-6">
                            Kontaktieren Sie <span className="italic text-rose-600">uns</span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Wir sind für Sie da! Ob Fragen zu Produkten, Bestellungen oder Beratung –
                            unser Team hilft Ihnen gerne weiter.
                        </p>
                    </div>
                </section>

                {/* Contact Cards */}
                <section className="px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 text-center">
                                <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-serif text-lg text-gray-900 mb-2">Adresse</h3>
                                <p className="text-sm text-gray-600">
                                    Musterstraße 10<br />
                                    10115 Berlin<br />
                                    Deutschland
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 text-center">
                                <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Phone className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-serif text-lg text-gray-900 mb-2">Telefon</h3>
                                <p className="text-sm text-gray-600">
                                    +49 (30) 123 456 789<br />
                                    Mo-Fr: 9:00 - 18:00
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 text-center">
                                <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-serif text-lg text-gray-900 mb-2">E-Mail</h3>
                                <p className="text-sm text-gray-600">
                                    info@elegance-beauty.de<br />
                                    support@elegance-beauty.de
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 text-center">
                                <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-serif text-lg text-gray-900 mb-2">Öffnungszeiten</h3>
                                <p className="text-sm text-gray-600">
                                    Mo-Fr: 9:00 - 20:00<br />
                                    Sa: 10:00 - 18:00<br />
                                    So: 11:00 - 17:00
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Form & Map */}
                <section className="px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Form */}
                            <div>
                                <h2 className="text-3xl font-serif text-gray-900 mb-2">
                                    Schreiben Sie uns
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ihr Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            placeholder="Max Mustermann"
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
                                            placeholder="max@beispiel.de"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Betreff *
                                        </label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        >
                                            <option value="">Bitte wählen</option>
                                            <option value="product">Produktanfrage</option>
                                            <option value="order">Bestellung & Lieferung</option>
                                            <option value="advice">Beratung</option>
                                            <option value="complaint">Reklamation</option>
                                            <option value="other">Sonstiges</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ihre Nachricht *
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            required
                                            rows={6}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                                            placeholder="Wie können wir Ihnen helfen?"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isSubmitted}
                                        className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isSubmitted
                                                ? 'bg-green-600 text-white'
                                                : 'bg-rose-600 text-white hover:bg-rose-700'
                                            } disabled:cursor-not-allowed`}
                                    >
                                        {isSubmitted ? (
                                            <>Nachricht gesendet! ✓</>
                                        ) : isSubmitting ? (
                                            <>Wird gesendet...</>
                                        ) : (
                                            <>
                                                Nachricht senden
                                                <Send className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Map */}
                            <div>
                                <h2 className="text-3xl font-serif text-gray-900 mb-2">
                                    Besuchen Sie uns
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Kommen Sie in unserem Salon vorbei und lassen Sie sich persönlich beraten.
                                </p>

                                <div className="rounded-2xl overflow-hidden h-[500px] bg-gray-200 relative">
                                    {/* Placeholder для карты */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center text-gray-500">
                                            <MapPin className="w-16 h-16 mx-auto mb-4" />
                                            <p className="text-lg font-medium">Google Maps</p>
                                            <p className="text-sm">Musterstraße 10, 10115 Berlin</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 bg-rose-50 rounded-2xl p-6">
                                    <h3 className="font-serif text-xl text-gray-900 mb-3">
                                        Anfahrt
                                    </h3>
                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div>
                                            <strong className="text-gray-900">Mit der U-Bahn:</strong>
                                            <p>U6 bis Oranienburger Tor (5 Min. Fußweg)</p>
                                        </div>
                                        <div>
                                            <strong className="text-gray-900">Mit dem Bus:</strong>
                                            <p>Bus 142, 245 Haltestelle Musterplatz</p>
                                        </div>
                                        <div>
                                            <strong className="text-gray-900">Parkplätze:</strong>
                                            <p>Parkhaus Musterstraße (2 Min. entfernt)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="px-6 lg:px-8 mt-20">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-serif text-gray-900 mb-8 text-center">
                            Häufig gestellte Fragen
                        </h2>
                        <div className="space-y-4">
                            {[
                                {
                                    q: 'Wie lange dauert die Lieferung?',
                                    a: 'Standard-Lieferungen dauern 2-3 Werktage. Express-Lieferung am nächsten Werktag möglich.'
                                },
                                {
                                    q: 'Kann ich Produkte zurückgeben?',
                                    a: 'Ja, Sie haben 14 Tage Rückgaberecht ab Erhalt der Ware.'
                                },
                                {
                                    q: 'Bieten Sie Produktberatung an?',
                                    a: 'Ja, unser Team berät Sie gerne telefonisch, per E-Mail oder persönlich im Salon.'
                                },
                                {
                                    q: 'Sind die Produkte original?',
                                    a: 'Ja, wir garantieren 100% Originalprodukte von offiziellen Händlern und Marken.'
                                }
                            ].map((faq, index) => (
                                <details
                                    key={index}
                                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-rose-200 transition-colors group"
                                >
                                    <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                                        {faq.q}
                                        <span className="text-rose-600 group-open:rotate-180 transition-transform">
                                            ▼
                                        </span>
                                    </summary>
                                    <p className="mt-4 text-gray-600">{faq.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}