// app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) {
                throw signInError;
            }

            if (data.user) {
                // Успешный вход
                router.push('/profile');
                router.refresh();
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Fehler beim Anmelden. Bitte versuchen Sie es erneut.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                <div className="max-w-md mx-auto px-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        Zurück zur Startseite
                    </Link>

                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogIn className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
                            </div>
                            <h1 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
                                Willkommen zurück
                            </h1>
                            <p className="text-gray-600">
                                Melden Sie sich an, um fortzufahren
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    E-Mail
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="ihre.email@beispiel.de"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Passwort
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                    />
                                    <span className="text-gray-600">Angemeldet bleiben</span>
                                </label>
                                <Link
                                    href="/auth/reset-password"
                                    className="text-rose-600 hover:text-rose-700 font-medium"
                                >
                                    Passwort vergessen?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Noch kein Konto?{' '}
                                <Link
                                    href="/auth/register"
                                    className="text-rose-600 hover:text-rose-700 font-medium"
                                >
                                    Jetzt registrieren
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
