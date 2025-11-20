// app/auth/update-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
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

        // Валидация
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

            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.password,
            });

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);

            // Перенаправляем на страницу профиля через 2 секунды
            setTimeout(() => {
                router.push('/profile');
            }, 2000);
        } catch (err: any) {
            console.error('Update password error:', err);
            setError(err.message || 'Fehler beim Aktualisieren des Passworts. Bitte versuchen Sie es erneut.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <main className="pt-24 pb-16">
                    <div className="max-w-md mx-auto px-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-serif text-gray-900 mb-2">
                                Passwort aktualisiert!
                            </h1>
                            <p className="text-gray-600 mb-6">
                                Ihr Passwort wurde erfolgreich geändert.
                            </p>
                            <p className="text-sm text-gray-500">
                                Sie werden in Kürze zu Ihrem Profil weitergeleitet...
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
                <div className="max-w-md mx-auto px-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-rose-600" />
                            </div>
                            <h1 className="text-3xl font-serif text-gray-900 mb-2">
                                Neues Passwort festlegen
                            </h1>
                            <p className="text-gray-600">
                                Bitte geben Sie Ihr neues Passwort ein
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
                                    Neues Passwort
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Mindestens 6 Zeichen"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Passwort bestätigen
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Passwort wiederholen"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Wird aktualisiert...' : 'Passwort aktualisieren'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                href="/auth/login"
                                className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                            >
                                Zurück zur Anmeldung
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
