// app/admin/sms/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    MessageSquare,
    Users,
    Send,
    CheckCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { apiPost } from '@/lib/api/client';

interface Recipient {
    phone: string;
    name?: string;
    source: 'profile' | 'newsletter';
}

export default function AdminSMSPage() {
    const [message, setMessage] = useState('');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const maxLength = 160;
    const remaining = maxLength - message.length;

    useEffect(() => {
        loadRecipients();
    }, []);

    async function loadRecipients() {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/sms/recipients');

            if (!response.ok) {
                throw new Error('Fehler beim Laden der Empfänger');
            }

            const data = await response.json();
            setRecipients(data.recipients || []);
        } catch (err: any) {
            console.error('Error loading recipients:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();

        if (!message.trim()) {
            setError('Bitte geben Sie eine Nachricht ein');
            return;
        }

        if (recipients.length === 0) {
            setError('Keine Empfänger gefunden');
            return;
        }

        setSending(true);
        setError(null);
        setSuccess(false);

        try {
            const data = await apiPost('/api/admin/sms/send', {
                message: message.trim(),
                recipients: recipients,
            });

            setSuccess(true);
            setMessage('');

            // Скрываем сообщение через 5 секунд
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            console.error('Error sending SMS:', err);
            setError(err.message || 'Fehler beim Senden der SMS');
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        <span className="ml-3 text-gray-600">Lädt Empfänger...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back */}
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Admin Dashboard
                </Link>

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-6 h-6 text-amber-600" />
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight">
                        SMS-Nachrichten
                    </h1>
                </div>

                <p className="text-sm text-gray-500 mb-8">
                    Senden Sie SMS-Nachrichten an Newsletter-Abonnenten und Kunden mit aktiver Rассылка.
                </p>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        <form
                            onSubmit={handleSend}
                            className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nachricht *
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    rows={6}
                                    maxLength={maxLength}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                    placeholder="Ihre Nachricht an die Abonnenten..."
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-gray-500">
                                        Empfohlen: Kurz und prägnant
                                    </p>
                                    <p
                                        className={`text-xs font-medium ${remaining < 20
                                            ? 'text-red-600'
                                            : remaining < 50
                                                ? 'text-amber-600'
                                                : 'text-gray-500'
                                            }`}
                                    >
                                        {remaining} Zeichen übrig
                                    </p>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                    Vorschau:
                                </p>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                                        {message || 'Ihre Nachricht wird hier angezeigt...'}
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-900">
                                            SMS erfolgreich gesendet!
                                        </p>
                                        <p className="text-xs text-green-700 mt-1">
                                            Die Nachricht wurde an {recipients.length} Empfänger gesendet.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={sending || !message.trim() || recipients.length === 0}
                                className="w-full py-4 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sendet...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        SMS an {recipients.length} Empfänger senden
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Recipients Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Empfänger
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="text-3xl font-light text-gray-900 mb-1">
                                        {recipients.length}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Gesamt Empfänger
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="text-2xl font-light text-blue-600 mb-1">
                                        {recipients.filter((r) => r.source === 'profile').length}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Kunden (Profil)
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <div className="text-2xl font-light text-purple-600 mb-1">
                                        {recipients.filter((r) => r.source === 'newsletter').length}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Newsletter-Abonnenten
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 mb-2">
                                    ℹ️ Hinweis
                                </h3>
                                <ul className="text-xs text-gray-600 space-y-2">
                                    <li>• Nur aktive Abonnenten erhalten SMS</li>
                                    <li>• Telefonnummern werden validiert</li>
                                    <li>• Max. 160 Zeichen pro SMS</li>
                                    <li>• Kosten werden berechnet</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
