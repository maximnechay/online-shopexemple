'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';

export default function UnsubscribePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (email) {
            handleUnsubscribe();
        } else {
            // Если email не указан, проверяем авторизацию
            checkAuth();
        }
    }, [email]);

    const checkAuth = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError('Bitte geben Sie Ihre E-Mail-Adresse an oder melden Sie sich an.');
            setLoading(false);
        } else {
            await unsubscribeUser(user.id);
        }
    };

    const handleUnsubscribe = async () => {
        if (!email) return;

        try {
            // Используем API endpoint для отписки
            const response = await fetch('/api/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess(true);
                console.log('✅ Unsubscribe successful:', data);
            } else {
                setError(data.error || 'E-Mail nicht gefunden.');
                console.error('❌ Unsubscribe failed:', data);
            }
        } catch (err) {
            console.error('Unsubscribe error:', err);
            setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeUser = async (userId: string) => {
        try {
            const supabase = createClient();

            // Сначала получаем email пользователя
            const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single();

            if (profile?.email) {
                // Используем API endpoint
                const response = await fetch('/api/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: profile.email }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setSuccess(true);
                } else {
                    setError('Fehler beim Abbestellen.');
                }
            } else {
                setError('Fehler beim Abbestellen.');
            }
        } catch (err) {
            console.error('Unsubscribe error:', err);
            setError('Ein Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />

            <main className="flex-1 pt-24 pb-16">
                <div className="max-w-2xl mx-auto px-6 lg:px-8">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Wird bearbeitet...</p>
                        </div>
                    ) : success ? (
                        <div className="text-center py-20">
                            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
                            <h1 className="text-3xl font-serif text-gray-900 mb-4">
                                Erfolgreich abgemeldet
                            </h1>
                            <p className="text-gray-600 mb-8 text-lg">
                                Sie wurden erfolgreich von unserem Newsletter abgemeldet.<br />
                                Sie werden keine weiteren E-Mails von uns erhalten.
                            </p>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">
                                    Sie können sich jederzeit wieder anmelden in Ihrem{' '}
                                    <Link href="/profile" className="text-rose-600 hover:underline">
                                        Profil
                                    </Link>{' '}
                                    oder auf unserer{' '}
                                    <Link href="/" className="text-rose-600 hover:underline">
                                        Startseite
                                    </Link>
                                    .
                                </p>
                                <div className="pt-4">
                                    <Link
                                        href="/"
                                        className="inline-block px-8 py-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
                                    >
                                        Zur Startseite
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <XCircle className="w-20 h-20 text-red-600 mx-auto mb-6" />
                            <h1 className="text-3xl font-serif text-gray-900 mb-4">
                                Fehler beim Abmelden
                            </h1>
                            <p className="text-gray-600 mb-8 text-lg">
                                {error || 'Ein unerwarteter Fehler ist aufgetreten.'}
                            </p>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">
                                    Bitte kontaktieren Sie uns unter{' '}
                                    <a href="mailto:nechay1996@gmail.com" className="text-rose-600 hover:underline">
                                        nechay1996@gmail.com
                                    </a>
                                </p>
                                <div className="pt-4">
                                    <Link
                                        href="/"
                                        className="inline-block px-8 py-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
                                    >
                                        Zur Startseite
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
