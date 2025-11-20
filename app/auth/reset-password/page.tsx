// app/auth/reset-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });

            if (resetError) {
                throw resetError;
            }

            setSuccess(true);
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.message || 'Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.');
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
                                <Mail className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-serif text-gray-900 mb-2">
                                E-Mail gesendet!
                            </h1>
                            <p className="text-gray-600 mb-6">
                                Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts an <strong>{email}</strong> gesendet.
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Bitte überprüfen Sie auch Ihren Spam-Ordner, falls Sie die E-Mail nicht finden.
                            </p>
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Zurück zur Anmeldung
                            </Link>
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
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Zurück zur Anmeldung
                    </Link>

                    <div className="bg-white border border-gray-200 rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <KeyRound className="w-8 h-8 text-rose-600" />
                            </div>
                            <h1 className="text-3xl font-serif text-gray-900 mb-2">
                                Passwort zurücksetzen
                            </h1>
                            <p className="text-gray-600">
                                Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="ihre.email@beispiel.de"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Wird gesendet...' : 'Link senden'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
