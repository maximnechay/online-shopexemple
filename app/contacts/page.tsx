// app/contacts/page.tsx
'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useShopSettings } from '@/lib/hooks/useShopSettings';

export default function ContactsPage() {
    const { settings, loading } = useShopSettings();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Fehler beim Senden');
            }

            setIsSubmitted(true);

            // Сброс формы через 3 секунды
            setTimeout(() => {
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                });
                setIsSubmitted(false);
            }, 5000);
        } catch (err: any) {
            console.error('Error submitting form:', err);
            setError(err.message || 'Fehler beim Senden der Nachricht');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="pt-24 pb-20">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <div className="h-12 w-48 bg-gray-100 rounded mx-auto mb-4 animate-pulse" />
                            <div className="h-6 w-96 bg-gray-100 rounded mx-auto animate-pulse" />
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

            <main className="pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Hero */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl lg:text-6xl font-light text-gray-900 tracking-tight mb-4">
                            Kontakt
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Wir helfen Ihnen gerne weiter. Schreiben Sie uns oder
                            besuchen Sie unseren Salon.
                        </p>
                    </div>

                    {/* Info cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {/* Адрес */}
                        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center">
                            <MapPin className="w-8 h-8 mx-auto text-gray-900 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Adresse
                            </h3>
                            <p className="text-sm text-gray-600 whitespace-pre-line">
                                {settings?.address || 'Adresse nicht gesetzt'}
                            </p>
                        </div>

                        {/* Телефон */}
                        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center">
                            <Phone className="w-8 h-8 mx-auto text-gray-900 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Telefon
                            </h3>
                            <p className="text-sm text-gray-600">
                                {settings?.phone || 'Nicht angegeben'}
                            </p>
                            {settings?.phone && (
                                <a
                                    href={`tel:${settings.phone.replace(/\s/g, '')}`}
                                    className="inline-block mt-2 text-xs text-gray-900 hover:underline"
                                >
                                    Jetzt anrufen →
                                </a>
                            )}
                        </div>

                        {/* Email */}
                        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center">
                            <Mail className="w-8 h-8 mx-auto text-gray-900 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                E-Mail
                            </h3>
                            <p className="text-sm text-gray-600 break-all">
                                {settings?.email || 'Nicht angegeben'}
                            </p>
                            {settings?.email && (
                                <a
                                    href={`mailto:${settings.email}`}
                                    className="inline-block mt-2 text-xs text-gray-900 hover:underline"
                                >
                                    E-Mail senden →
                                </a>
                            )}
                        </div>

                        {/* Часы работы */}
                        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center">
                            <Clock className="w-8 h-8 mx-auto text-gray-900 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Öffnungszeiten
                            </h3>
                            <p className="text-sm text-gray-600 whitespace-pre-line">
                                {settings?.openHours || 'Nicht definiert'}
                            </p>
                        </div>
                    </div>

                    {/* Form + Map */}
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Form */}
                        <div>
                            <h2 className="text-3xl font-light text-gray-900 mb-4">
                                Schreiben Sie uns
                            </h2>
                            <p className="text-gray-600 mb-10">
                                Wir melden uns so schnell wie möglich zurück.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Ihr Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
                                        placeholder="Max Mustermann"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        E-Mail *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
                                        placeholder="max@beispiel.de"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Betreff *
                                    </label>
                                    <select
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
                                    >
                                        <option value="">Bitte wählen</option>
                                        <option value="product">
                                            Produktanfrage
                                        </option>
                                        <option value="order">
                                            Bestellung & Lieferung
                                        </option>
                                        <option value="advice">Beratung</option>
                                        <option value="other">Sonstiges</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">
                                        Ihre Nachricht *
                                    </label>
                                    <textarea
                                        name="message"
                                        required
                                        rows={6}
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none resize-none"
                                        placeholder="Wie können wir Ihnen helfen?"
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                                        ❌ {error}
                                    </div>
                                )}

                                {/* Success Message */}
                                {isSubmitted && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                                        ✓ Nachricht erfolgreich gesendet! Wir melden uns bald bei Ihnen.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || isSubmitted}
                                    className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                                        ${isSubmitted
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }
                                        disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    {isSubmitted
                                        ? 'Nachricht gesendet ✓'
                                        : isSubmitting
                                            ? 'Wird gesendet…'
                                            : 'Nachricht senden'}
                                    {!isSubmitted && !isSubmitting && (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Map */}
                        <div>
                            <h2 className="text-3xl font-light text-gray-900 mb-4">
                                Besuchen Sie uns
                            </h2>
                            <p className="text-gray-600 mb-10">
                                Unser Salon befindet sich hier:
                            </p>

                            <div className="rounded-3xl overflow-hidden h-[450px] border border-gray-200">
                                {settings?.mapEmbedUrl ? (
                                    <iframe
                                        src={settings.mapEmbedUrl}
                                        className="w-full h-full"
                                        loading="lazy"
                                        allowFullScreen
                                        title="Shop Location"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-sm p-8 text-center">
                                        <MapPin className="w-12 h-12 mb-4 text-gray-400" />
                                        <p className="mb-2">
                                            Karte ist noch nicht eingerichtet
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Admin kann die Google Maps URL in den
                                            Einstellungen hinzufügen
                                        </p>
                                    </div>
                                )}
                            </div>

                            {settings?.address && (
                                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                    <p className="text-sm text-gray-600 font-medium mb-2">
                                        Anfahrt:
                                    </p>
                                    <p className="text-sm text-gray-800 whitespace-pre-line">
                                        {settings.address}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}