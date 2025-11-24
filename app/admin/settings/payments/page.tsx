// app/admin/settings/payments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    CreditCard,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';

interface PaymentSettings {
    id: number;
    mode: 'test' | 'live';
    currency: string;
    vat_rate: number;
    stripe_enabled: boolean;
    paypal_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export default function PaymentSettingsPage() {
    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [mode, setMode] = useState<'test' | 'live'>('test');
    const [currency, setCurrency] = useState('EUR');
    const [vatRate, setVatRate] = useState(19);
    const [stripeEnabled, setStripeEnabled] = useState(true);
    const [paypalEnabled, setPaypalEnabled] = useState(false);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings/payments');
            if (res.ok) {
                const data = await res.json();
                setSettings(data.settings);
                setMode(data.settings.mode);
                setCurrency(data.settings.currency);
                setVatRate(data.settings.vat_rate);
                setStripeEnabled(data.settings.stripe_enabled);
                setPaypalEnabled(data.settings.paypal_enabled);
            } else {
                console.error('Failed to load settings');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/settings/payments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    currency,
                    vat_rate: vatRate,
                    stripe_enabled: stripeEnabled,
                    paypal_enabled: paypalEnabled,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSettings(data.settings);
                setMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Fehler beim Speichern' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Fehler beim Speichern der Einstellungen' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Lade Einstellungen...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin/settings"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zu Einstellungen
                    </Link>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-light text-gray-900 tracking-tight">
                            Zahlungseinstellungen
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Konfigurieren Sie Zahlungsmethoden, Währung und Steuersätze
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                    >
                        {message.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : (
                            <AlertCircle className="w-5 h-5" />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Settings Form */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-8 space-y-6">

                        {/* Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Modus
                            </label>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as 'test' | 'live')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            >
                                <option value="test">Test (Testmodus)</option>
                                <option value="live">Live (Produktivmodus)</option>
                            </select>
                            <p className="mt-2 text-sm text-gray-600">
                                {mode === 'test'
                                    ? '⚠️ Testmodus: Verwenden Sie Test-API-Keys'
                                    : '🔴 Live-Modus: Echte Zahlungen werden verarbeitet'}
                            </p>
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Währung
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            >
                                <option value="EUR">EUR (€) - Euro</option>
                                <option value="USD">USD ($) - US Dollar</option>
                                <option value="GBP">GBP (£) - British Pound</option>
                                <option value="CHF">CHF (Fr) - Swiss Franc</option>
                            </select>
                            <p className="mt-2 text-sm text-gray-600">
                                Währung für alle Preise und Transaktionen
                            </p>
                        </div>

                        {/* VAT Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Mehrwertsteuersatz (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={vatRate}
                                onChange={(e) => setVatRate(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                placeholder="19"
                            />
                            <p className="mt-2 text-sm text-gray-600">
                                Standard-MwSt.-Satz für Deutschland: 19%
                            </p>
                        </div>

                        {/* Payment Methods */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-4">
                                Zahlungsmethoden
                            </label>

                            <div className="space-y-4">
                                {/* Stripe */}
                                <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        id="stripe"
                                        checked={stripeEnabled}
                                        onChange={(e) => setStripeEnabled(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="stripe" className="block font-medium text-gray-900 cursor-pointer">
                                            Stripe aktivieren
                                        </label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Kreditkarten, Apple Pay, Google Pay
                                        </p>
                                    </div>
                                </div>

                                {/* PayPal */}
                                <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        id="paypal"
                                        checked={paypalEnabled}
                                        onChange={(e) => setPaypalEnabled(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="paypal" className="block font-medium text-gray-900 cursor-pointer">
                                            PayPal aktivieren
                                        </label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            PayPal-Zahlungen und PayPal Credit
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Last Updated */}
                        {settings && (
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Zuletzt aktualisiert:{' '}
                                    {new Date(settings.updated_at).toLocaleString('de-DE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between items-center">
                        <Link
                            href="/admin/settings"
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Abbrechen
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:bg-gray-400"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Speichert...' : 'Einstellungen speichern'}
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-blue-900 mb-2">
                                Wichtige Hinweise
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Stellen Sie sicher, dass die entsprechenden API-Keys in den Umgebungsvariablen konfiguriert sind</li>
                                <li>• Im Testmodus werden keine echten Zahlungen verarbeitet</li>
                                <li>• Wechseln Sie erst zu Live-Modus, wenn alle Tests erfolgreich waren</li>
                                <li>• Änderungen wirken sich sofort auf alle neuen Transaktionen aus</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
