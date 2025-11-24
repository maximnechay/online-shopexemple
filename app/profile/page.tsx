// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Save, Package, Bell } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
    });
    const [newsletterEnabled, setNewsletterEnabled] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }

        if (user) {
            loadProfile();
        }
    }, [user, loading, router]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const supabase = createClient();

            // ✅ ИСПРАВЛЕНО: Используем правильный клиент с кешем
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Load profile error:', error);
                return;
            }

            if (data) {
                const fullName = data.full_name || '';
                const [firstName = '', ...lastNameParts] = fullName.split(' ');
                const lastName = lastNameParts.join(' ');

                // Парсим адрес (формат: "Улица Номер")
                let street = '';
                let houseNumber = '';
                if (data.address) {
                    const addressParts = data.address.trim().split(/\s+/);
                    if (addressParts.length > 0) {
                        const lastPart = addressParts[addressParts.length - 1];
                        if (/^\d+[a-zA-Z]?$/.test(lastPart)) {
                            houseNumber = lastPart;
                            street = addressParts.slice(0, -1).join(' ');
                        } else {
                            street = data.address;
                        }
                    }
                }

                setFormData({
                    firstName,
                    lastName,
                    phone: data.phone || '',
                    street: street || '',
                    houseNumber: houseNumber || '',
                    postalCode: data.postal_code || '',
                    city: data.city || '',
                });

                // Загружаем статус подписки
                setNewsletterEnabled(data.newsletter_enabled || false);
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaveSuccess(false);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const supabase = createClient();

            // Формируем полное имя
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();

            // Формируем адрес из улицы и номера
            const address = formData.street && formData.houseNumber
                ? `${formData.street} ${formData.houseNumber}`
                : formData.street || '';

            // Обновляем профиль в БД
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    phone: formData.phone || null,
                    address: address || null,
                    city: formData.city || null,
                    postal_code: formData.postalCode || null,
                    newsletter_enabled: newsletterEnabled,
                })
                .eq('id', user!.id);

            if (updateError) {
                throw updateError;
            }

            // Также обновляем user_metadata для имени
            await supabase.auth.updateUser({
                data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                },
            });

            setSaveSuccess(true);

            // ✅ ДОБАВЛЕНО: Перезагружаем профиль после сохранения
            await loadProfile();

            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            console.error('Update profile error:', err);
            setError(err.message || 'Fehler beim Speichern. Bitte versuchen Sie es erneut.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="pt-40 md:pt-24 pb-16">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center py-16">
                            <p className="text-gray-600">Lädt...</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    <h1 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-8">
                        Mein Profil
                    </h1>

                    <div className="grid md:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="md:col-span-1">
                            <nav className="space-y-2">
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-3 px-4 py-3 bg-rose-50 text-rose-600 rounded-lg font-medium"
                                >
                                    <User className="w-5 h-5" />
                                    <span>Profildaten</span>
                                </Link>
                                <Link
                                    href="/profile/orders"
                                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                >
                                    <Package className="w-5 h-5" />
                                    <span>Bestellungen</span>
                                </Link>
                            </nav>
                        </div>

                        {/* Main Content */}
                        <div className="md:col-span-3">
                            <div className="bg-white border border-gray-200 rounded-2xl p-8">
                                <h2 className="text-2xl font-serif text-gray-900 mb-6">
                                    Persönliche Daten
                                </h2>

                                {saveSuccess && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                        Ihre Daten wurden erfolgreich gespeichert!
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* E-Mail (nicht bearbeitbar) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            E-Mail
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                value={user.email || ''}
                                                disabled
                                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            E-Mail-Adresse kann nicht geändert werden
                                        </p>
                                    </div>

                                    {/* Name */}
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
                                    </div>

                                    {/* Telefon */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Telefon
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Adresse */}
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            <MapPin className="w-5 h-5" />
                                            Lieferadresse
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-4 gap-4">
                                                <div className="md:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Straße
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="street"
                                                        value={formData.street}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Nr.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="houseNumber"
                                                        value={formData.houseNumber}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        PLZ
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="postalCode"
                                                        value={formData.postalCode}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Stadt
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Newsletter Subscription */}
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            <Bell className="w-5 h-5" />
                                            Newsletter-Einstellungen
                                        </h3>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newsletterEnabled}
                                                onChange={(e) => setNewsletterEnabled(e.target.checked)}
                                                className="mt-1 w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-gray-900">
                                                    Ich möchte Newsletter erhalten
                                                </span>
                                                <span className="block text-xs text-gray-500 mt-1">
                                                    Erhalten Sie exklusive Angebote, neue Produkte und Beauty-Tipps per E-Mail.
                                                    Sie können sich jederzeit abmelden.
                                                </span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end pt-6 border-t border-gray-200">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-5 h-5" />
                                            {isSaving ? 'Wird gespeichert...' : 'Speichern'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}