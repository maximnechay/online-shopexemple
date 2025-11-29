// app/auth/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        newsletter: false,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Валидация паролей
        if (formData.password !== formData.confirmPassword) {
            setError('Passwörter stimmen nicht überein');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Passwort muss mindestens 6 Zeichen lang sein');
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createClient();

            // Регистрация пользователя
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        full_name: fullName, // Добавляем для триггера profiles
                        newsletter_enabled: formData.newsletter,
                    },
                },
            });

            if (signUpError) {
                throw signUpError;
            }

            if (data.user) {
                setSuccess(true);
                // Перенаправляем через 2 секунды
                setTimeout(() => {
                    router.push('/auth/login');
                }, 2000);
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Fehler bei der Registrierung. Bitte versuchen Sie es erneut.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="pt-24 pb-16">
                    <div className="max-w-2xl mx-auto px-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <UserPlus className="w-10 h-10 text-green-600" />
                            </div>
                            <h1 className="text-4xl font-serif text-gray-900 mb-3">
                                Registrierung erfolgreich!
                            </h1>
                            <p className="text-lg text-gray-600 mb-8">
                                Bitte überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.
                            </p>
                            <p className="text-gray-500">
                                Sie werden in Kürze zur Anmeldeseite weitergeleitet...
                            </p>
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
                <div className="max-w-2xl mx-auto px-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zurück zur Startseite
                    </Link>

                    <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-12">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <UserPlus className="w-10 h-10 text-rose-600" />
                            </div>
                            <h1 className="text-4xl font-serif text-gray-900 mb-3">
                                Konto erstellen
                            </h1>
                            <p className="text-lg text-gray-600">
                                Registrieren Sie sich für exklusive Vorteile
                            </p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name fields in a row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vorname
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Max"
                                            className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nachname
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Mustermann"
                                        className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                                    />
                                </div>
                            </div>

                            {/* Email field - full width */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    E-Mail
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="ihre.email@beispiel.de"
                                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                                    />
                                </div>
                            </div>

                            {/* Password fields in a row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Passwort
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Mindestens 6 Zeichen"
                                            className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Passwort bestätigen
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Passwort wiederholen"
                                            className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Newsletter Checkbox */}
                            <div className="flex items-start gap-3 pt-2 bg-gray-50 p-5 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="newsletter"
                                    name="newsletter"
                                    checked={formData.newsletter}
                                    onChange={handleInputChange}
                                    className="mt-1 w-5 h-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                />
                                <label htmlFor="newsletter" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                                    Ich möchte den Newsletter erhalten und über neue Produkte, Angebote und
                                    exklusive Aktionen informiert werden. Die Abmeldung ist jederzeit möglich.
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-rose-600 text-white py-4 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
                            >
                                {isLoading ? 'Wird registriert...' : 'Registrieren'}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                Bereits ein Konto?{' '}
                                <Link
                                    href="/auth/login"
                                    className="text-rose-600 hover:text-rose-700 font-medium"
                                >
                                    Jetzt anmelden
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}