// app/admin/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Settings,
    Store,
    Mail,
    Phone,
    MapPin,
    Globe,
    Truck,
    Euro,
    Percent,
    Clock,
    Map,
} from 'lucide-react';

interface ShopSettings {
    // Основная информация
    shopName: string;
    shopSubtitle: string;
    supportEmail: string;
    supportPhone: string;
    addressLine: string;
    postalCode: string;
    city: string;
    country: string;
    defaultCurrency: string;
    freeShippingFrom: string;
    shippingCost: string;
    taxRate: string;
    homepageHeroText: string;

    // Контактная информация
    address: string;
    phone: string;
    email: string;
    openHours: string;
    mapEmbedUrl: string;
}

export default function AdminSettingsPage() {
    const [form, setForm] = useState<ShopSettings>({
        shopName: '',
        shopSubtitle: '',
        supportEmail: '',
        supportPhone: '',
        addressLine: '',
        postalCode: '',
        city: '',
        country: 'Deutschland',
        defaultCurrency: 'EUR',
        freeShippingFrom: '',
        shippingCost: '',
        taxRate: '',
        homepageHeroText: '',
        address: '',
        phone: '',
        email: '',
        openHours: '',
        mapEmbedUrl: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Загрузка текущих настроек
    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch('/api/admin/settings');

                if (!res.ok) {
                    if (res.status === 404) {
                        setLoading(false);
                        return;
                    }
                    throw new Error('Einstellungen konnten nicht geladen werden');
                }

                const data = await res.json();

                setForm({
                    shopName: data.shopName ?? '',
                    shopSubtitle: data.shopSubtitle ?? '',
                    supportEmail: data.supportEmail ?? '',
                    supportPhone: data.supportPhone ?? '',
                    addressLine: data.addressLine ?? '',
                    postalCode: data.postalCode ?? '',
                    city: data.city ?? '',
                    country: data.country ?? 'Deutschland',
                    defaultCurrency: data.defaultCurrency ?? 'EUR',
                    freeShippingFrom:
                        data.freeShippingFrom != null
                            ? String(data.freeShippingFrom)
                            : '',
                    shippingCost:
                        data.shippingCost != null
                            ? String(data.shippingCost)
                            : '',
                    taxRate: data.taxRate != null ? String(data.taxRate) : '',
                    homepageHeroText: data.homepageHeroText ?? '',
                    address: data.address ?? '',
                    phone: data.phone ?? '',
                    email: data.email ?? '',
                    openHours: data.openHours ?? '',
                    mapEmbedUrl: data.mapEmbedUrl ?? '',
                });
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Fehler beim Laden der Einstellungen');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const change = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError(null);
        setSuccess(false);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const payload = {
                shopName: form.shopName.trim(),
                shopSubtitle: form.shopSubtitle.trim(),
                supportEmail: form.supportEmail.trim(),
                supportPhone: form.supportPhone.trim(),
                addressLine: form.addressLine.trim(),
                postalCode: form.postalCode.trim(),
                city: form.city.trim(),
                country: form.country.trim(),
                defaultCurrency: form.defaultCurrency.trim() || 'EUR',
                freeShippingFrom: form.freeShippingFrom
                    ? Number(form.freeShippingFrom)
                    : null,
                shippingCost: form.shippingCost
                    ? Number(form.shippingCost)
                    : null,
                taxRate: form.taxRate ? Number(form.taxRate) : null,
                homepageHeroText: form.homepageHeroText.trim(),
                address: form.address.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                openHours: form.openHours.trim(),
                mapEmbedUrl: form.mapEmbedUrl.trim(),
            };

            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                    data.error || 'Fehler beim Speichern der Einstellungen'
                );
            }

            setSuccess(true);

            // Скрываем сообщение об успехе через 3 секунды
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Unbekannter Fehler');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="h-8 w-40 bg-gray-100 rounded mb-4 animate-pulse" />
                    <div className="h-4 w-64 bg-gray-100 rounded mb-8 animate-pulse" />
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 animate-pulse h-80" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Back */}
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Admin Dashboard
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-6 h-6 text-gray-800" />
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight">
                        Shop Einstellungen
                    </h1>
                </div>

                <p className="text-sm text-gray-500 mb-8">
                    Grundlegende Informationen, Kontakt und Versandoptionen Ihres
                    Shops.
                </p>

                <form
                    onSubmit={submit}
                    className="space-y-8 bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm"
                >
                    {/* Allgemein */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
                            Allgemeine Informationen
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Shop Name *
                            </label>
                            <div className="flex items-center gap-3">
                                <Store className="w-5 h-5 text-gray-500" />
                                <input
                                    name="shopName"
                                    value={form.shopName}
                                    onChange={change}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Beautysalon Harmonie"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Untertitel / Claim
                            </label>
                            <input
                                name="shopSubtitle"
                                value={form.shopSubtitle}
                                onChange={change}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Premium Beauty für jeden Tag"
                            />
                        </div>
                    </div>

                    {/* Kontakt & Adresse (Admin) */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
                            Kontakt & Adresse (Admin)
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kontakt E-Mail *
                            </label>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-gray-500" />
                                <input
                                    name="supportEmail"
                                    type="email"
                                    value={form.supportEmail}
                                    onChange={change}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="info@beautyshop.de"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telefonnummer
                            </label>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-500" />
                                <input
                                    name="supportPhone"
                                    value={form.supportPhone}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="+49 511 123456"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Straße & Hausnummer
                            </label>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-gray-500" />
                                <input
                                    name="addressLine"
                                    value={form.addressLine}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Musterstraße 1"
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    PLZ
                                </label>
                                <input
                                    name="postalCode"
                                    value={form.postalCode}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="30159"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stadt
                                </label>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Hannover"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Land
                            </label>
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-gray-500" />
                                <input
                                    name="country"
                                    value={form.country}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Deutschland"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Контактная информация (для клиентов) */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
                            Kontaktseite (Öffentlich)
                        </h2>
                        <p className="text-xs text-gray-500">
                            Diese Informationen werden auf der Kontaktseite für Kunden
                            angezeigt.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vollständige Adresse
                            </label>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-500 mt-3" />
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={change}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                                    placeholder="Musterstraße 1&#10;30159 Hannover&#10;Deutschland"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Mehrzeilige Adresse für die Kontaktseite
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telefon (Öffentlich)
                            </label>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-500" />
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="+49 511 123456"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                E-Mail (Öffentlich)
                            </label>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-gray-500" />
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="kontakt@beautyshop.de"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Öffnungszeiten
                            </label>
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-gray-500 mt-3" />
                                <textarea
                                    name="openHours"
                                    value={form.openHours}
                                    onChange={change}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                                    placeholder="Mo-Fr: 9:00 - 18:00 Uhr&#10;Sa: 10:00 - 14:00 Uhr&#10;So: Geschlossen"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Google Maps Embed URL
                            </label>
                            <div className="flex items-start gap-3">
                                <Map className="w-5 h-5 text-gray-500 mt-3" />
                                <div className="flex-1">
                                    <input
                                        name="mapEmbedUrl"
                                        value={form.mapEmbedUrl}
                                        onChange={change}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="https://www.google.com/maps/embed?pb=..."
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        1. Öffnen Sie Google Maps<br />
                                        2. Suchen Sie Ihre Adresse<br />
                                        3. Klicken Sie auf "Teilen" → "Karte einbetten"<br />
                                        4. Kopieren Sie die URL aus dem iframe src
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Versand & Preise */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
                            Versand & Preise
                        </h2>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Standard Währung
                                </label>
                                <div className="flex items-center gap-3">
                                    <Euro className="w-5 h-5 text-gray-500" />
                                    <input
                                        name="defaultCurrency"
                                        value={form.defaultCurrency}
                                        onChange={change}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="EUR"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Versandkostenfrei ab
                                </label>
                                <div className="flex items-center gap-3">
                                    <Truck className="w-5 h-5 text-gray-500" />
                                    <input
                                        name="freeShippingFrom"
                                        type="number"
                                        step="0.01"
                                        value={form.freeShippingFrom}
                                        onChange={change}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="z. B. 49.00"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Wenn leer, wird keine Versandfreigrenze angezeigt.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Versandkosten (Standard)
                            </label>
                            <div className="flex items-center gap-3">
                                <Euro className="w-5 h-5 text-gray-500" />
                                <input
                                    name="shippingCost"
                                    type="number"
                                    step="0.01"
                                    value={form.shippingCost}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="z. B. 4.99"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Standard Versandkosten, wenn Bestellsumme unter der Freigrenze liegt.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mehrwertsteuer in %
                            </label>
                            <div className="flex items-center gap-3">
                                <Percent className="w-5 h-5 text-gray-500" />
                                <input
                                    name="taxRate"
                                    type="number"
                                    step="0.1"
                                    value={form.taxRate}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="z. B. 19"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Optional, wenn Sie diese Information im Checkout anzeigen
                                möchten.
                            </p>
                        </div>
                    </div>

                    {/* Startseite Text */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                        <h2 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
                            Startseite / Beschreibung
                        </h2>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kurztext für die Startseite
                        </label>
                        <textarea
                            name="homepageHeroText"
                            value={form.homepageHeroText}
                            onChange={change}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                            placeholder="Hochwertige Kosmetik von führenden Marken. Professionell ausgewählt, sicher und schnell geliefert."
                        />
                        <p className="text-xs text-gray-500">
                            Kann später auf der Startseite eingebunden werden, z. B. im
                            Hero Bereich.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                            ✓ Einstellungen wurden erfolgreich gespeichert
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Speichern...' : 'Einstellungen speichern'}
                    </button>
                </form>
            </div>
        </div>
    );
}