'use client';

import { useState, useEffect } from 'react';
import { Mail, Users, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiPost } from '@/lib/api/client';

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
    const [previewHTML, setPreviewHTML] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Загрузка получателей
    useEffect(() => {
        loadRecipients();
    }, []);

    // Загрузка предпросмотра при изменении subject или message
    useEffect(() => {
        const loadPreview = async () => {
            if (!subject && !message) {
                setPreviewHTML('');
                return;
            }

            setLoadingPreview(true);
            try {
                const data = await apiPost('/api/admin/newsletter/preview', { subject, message });
                if (data.success) {
                    setPreviewHTML(data.html);
                }
            } catch (err) {
                console.error('Fehler beim Laden der Vorschau:', err);
            } finally {
                setLoadingPreview(false);
            }
        };

        // Debounce для предпросмотра
        const timer = setTimeout(loadPreview, 500);
        return () => clearTimeout(timer);
    }, [subject, message]);

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
            const data = await apiPost('/api/admin/newsletter/send', {
                subject,
                message,
                recipients: recipients.map(r => ({ email: r.email, name: r.name })),
            });

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
                        Marketing-E-Mails
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
                    <div className="space-y-8">
                        {/* Form */}
                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200">
                            <form onSubmit={handleSend}>
                                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                                    <Mail className="w-6 h-6 text-rose-600" />
                                    Nachricht erstellen
                                </h2>

                                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                                    {/* Recipients Stats */}
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Users className="w-5 h-5 text-blue-600" />
                                            <h3 className="font-semibold text-gray-900">Empfänger</h3>
                                        </div>
                                        <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</div>
                                        <div className="text-xs text-gray-600">
                                            {stats.profiles} Profile, {stats.newsletter} Newsletter
                                        </div>
                                    </div>

                                    {/* Info Cards */}
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 lg:col-span-2">
                                        <h3 className="text-sm font-semibold mb-2 text-amber-900">💡 Tipps</h3>
                                        <div className="text-xs text-amber-800 grid grid-cols-2 gap-x-4 gap-y-1">
                                            <div>• Personalisieren Sie die Betreffzeile</div>
                                            <div>• Halten Sie die Nachricht kurz</div>
                                            <div>• Fügen Sie einen Call-to-Action hinzu</div>
                                            <div>• Testen Sie vor dem Versand</div>
                                        </div>
                                    </div>
                                </div>

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

                        {/* Preview - Full Width Below */}
                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200">
                            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                                <Mail className="w-6 h-6 text-rose-600" />
                                E-Mail Vorschau
                            </h3>

                            {loadingPreview ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                                </div>
                            ) : previewHTML ? (
                                <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-lg">
                                    <iframe
                                        srcDoc={previewHTML}
                                        className="w-full h-[800px] border-0"
                                        title="Email Preview"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl p-16 border border-gray-200 text-center">
                                    <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">
                                        Geben Sie einen Betreff und eine Nachricht ein,<br />
                                        um die Vorschau zu sehen
                                    </p>
                                </div>
                            )}

                            {previewHTML && (
                                <p className="text-sm text-gray-500 mt-4 text-center">
                                    So wird Ihre E-Mail bei den Empfängern aussehen
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
