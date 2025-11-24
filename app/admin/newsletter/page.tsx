'use client';

import { useState, useEffect } from 'react';
import { Mail, Users, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Recipient {
    email: string;
    name?: string;
    source: 'profile' | 'newsletter';
}

interface Stats {
    total: number;
    profiles: number;
    newsletter: number;
}

export default function NewsletterPage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, profiles: 0, newsletter: 0 });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Загрузка получателей
    useEffect(() => {
        loadRecipients();
    }, []);

    const loadRecipients = async () => {
        try {
            const response = await fetch('/api/admin/newsletter/recipients');
            const data = await response.json();

            if (data.success) {
                setRecipients(data.recipients);
                setStats({
                    total: data.count,
                    profiles: data.recipients.filter((r: Recipient) => r.source === 'profile').length,
                    newsletter: data.recipients.filter((r: Recipient) => r.source === 'newsletter').length,
                });
            }
        } catch (err) {
            console.error('Fehler beim Laden der Empfänger:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !message.trim()) {
            setError('Betreff und Nachricht sind erforderlich');
            return;
        }

        if (recipients.length === 0) {
            setError('Keine Empfänger gefunden');
            return;
        }

        setSending(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch('/api/admin/newsletter/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    message,
                    recipients: recipients.map(r => ({ email: r.email, name: r.name })),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setSubject('');
                setMessage('');
                setTimeout(() => setSuccess(false), 5000);
            } else {
                setError(data.error || 'Fehler beim Senden');
            }
        } catch (err) {
            setError('Netzwerkfehler beim Senden der E-Mails');
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zum Dashboard
                    </Link>

                    <h1 className="text-4xl lg:text-5xl font-light text-gray-900 tracking-tight mb-4">
                        Email-Rассылка
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl">
                        Senden Sie Marketing-E-Mails an Ihre Newsletter-Abonnenten und Kunden.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSend} className="bg-gray-50 rounded-3xl p-8 border border-gray-200">
                                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                                    <Mail className="w-6 h-6 text-rose-600" />
                                    Nachricht erstellen
                                </h2>

                                {/* Subject */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Betreff
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="z.B. Exklusive Angebote nur für Sie!"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        required
                                    />
                                </div>

                                {/* Message */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nachricht (HTML erlaubt)
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Ihre Marketing-Nachricht hier..."
                                        rows={12}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-sm"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        HTML-Tags werden unterstützt: &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;, &lt;br&gt;, etc.
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                                        {error}
                                    </div>
                                )}

                                {/* Success Message */}
                                {success && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                                        ✅ E-Mails erfolgreich gesendet an {stats.total} Empfänger!
                                    </div>
                                )}

                                {/* Send Button */}
                                <button
                                    type="submit"
                                    disabled={sending || recipients.length === 0}
                                    className="w-full bg-rose-600 text-white py-4 rounded-xl hover:bg-rose-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                >
                                    {sending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Senden...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            E-Mails senden ({stats.total})
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Sidebar - Stats & Preview */}
                        <div className="space-y-6">
                            {/* Recipients Stats */}
                            <div className="bg-blue-50 rounded-3xl p-6 border border-blue-200">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Empfänger
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Gesamt</span>
                                        <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
                                    </div>
                                    <div className="h-px bg-blue-200"></div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Kundenprofile</span>
                                        <span className="font-semibold">{stats.profiles}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Newsletter</span>
                                        <span className="font-semibold">{stats.newsletter}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            {(subject || message) && (
                                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold mb-4">Vorschau</h3>

                                    {subject && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-1">Betreff:</p>
                                            <p className="font-semibold text-gray-900">{subject}</p>
                                        </div>
                                    )}

                                    {message && (
                                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                                            <p className="text-xs text-gray-500 mb-2">Nachricht:</p>
                                            <div
                                                className="text-sm text-gray-700 prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: message }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info */}
                            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200">
                                <h3 className="text-sm font-semibold mb-2 text-amber-900">💡 Tipps</h3>
                                <ul className="text-xs text-amber-800 space-y-1">
                                    <li>• Personalisieren Sie die Betreffzeile</li>
                                    <li>• Halten Sie die Nachricht kurz und prägnant</li>
                                    <li>• Fügen Sie einen klaren Call-to-Action hinzu</li>
                                    <li>• Testen Sie vor dem Versand</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
