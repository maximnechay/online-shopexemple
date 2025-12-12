'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from '@/components/admin/ImageUpload';
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Monitor,
    Smartphone
} from 'lucide-react';

type FormState = {
    id?: string;
    title: string;
    subtitle: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    desktopImageUrl: string;
    mobileImageUrl: string;
    isActive: boolean;
};

export default function AdminHeroBannerPage() {
    const [form, setForm] = useState<FormState>({
        title: '',
        subtitle: '',
        description: '',
        buttonText: '',
        buttonUrl: '',
        desktopImageUrl: '',
        mobileImageUrl: '',
        isActive: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        loadBanner();
    }, []);

    async function loadBanner() {
        setLoading(true);
        setSaveError('');
        setSaveSuccess('');
        try {
            const supabase = createClient();

            const { data, error } = await supabase
                .from('home_banners')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('Error loading hero banner:', error);
                setSaveError('Fehler beim Laden des Banners');
                return;
            }

            if (data && data.length > 0) {
                const row = data[0];
                setForm({
                    id: row.id,
                    title: row.title || '',
                    subtitle: row.subtitle || '',
                    description: row.description || '',
                    buttonText: row.button_text || '',
                    buttonUrl: row.button_url || '',
                    desktopImageUrl: row.desktop_image_url || '',
                    mobileImageUrl: row.mobile_image_url || '',
                    isActive: row.is_active ?? true,
                });
            }
        } catch (e) {
            console.error(e);
            setSaveError('Unerwarteter Fehler beim Laden');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checkbox = e.target as HTMLInputElement;
            setForm((prev) => ({ ...prev, [name]: checkbox.checked }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        setSaveSuccess('');

        try {
            const supabase = createClient();

            if (!form.desktopImageUrl) {
                setSaveError('Desktop Bild ist erforderlich');
                setSaving(false);
                return;
            }

            const payload = {
                title: form.title || null,
                subtitle: form.subtitle || null,
                description: form.description || null,
                button_text: form.buttonText || null,
                button_url: form.buttonUrl || null,
                desktop_image_url: form.desktopImageUrl,
                mobile_image_url: form.mobileImageUrl || null,
                is_active: form.isActive,
            };

            if (form.id) {
                const { error } = await supabase
                    .from('home_banners')
                    .update(payload)
                    .eq('id', form.id);

                if (error) {
                    console.error('Error updating hero banner:', error);
                    setSaveError('Fehler beim Speichern des Banners');
                } else {
                    setSaveSuccess('Banner wurde gespeichert');
                }
            } else {
                const { data, error } = await supabase
                    .from('home_banners')
                    .insert(payload)
                    .select()
                    .single();

                if (error) {
                    console.error('Error inserting hero banner:', error);
                    setSaveError('Fehler beim Speichern des Banners');
                } else {
                    setForm((prev) => ({ ...prev, id: data.id }));
                    setSaveSuccess('Banner wurde erstellt');
                }
            }
        } catch (e) {
            console.error(e);
            setSaveError('Unerwarteter Fehler beim Speichern');
        } finally {
            setSaving(false);
        }
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600&h=900&fit=crop';

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Navigation */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/admin/home"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Startseite
                    </Link>
                    <span className="text-gray-300">/</span>
                    <Link
                        href="/admin"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-light text-gray-900 mb-2">Hero Banner</h1>
                    <p className="text-gray-600">
                        Großer Banner oben auf der Startseite mit Titel, Bild und Button.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Form */}
                    <div className="space-y-6 bg-gray-50 rounded-2xl p-6 border border-gray-200">

                        {/* Desktop Image */}
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Monitor className="w-4 h-4" />
                                Desktop Bild *
                            </div>
                            <p className="text-xs text-gray-500 mb-2">1600 × 900 px empfohlen</p>
                            <ImageUpload
                                existingImages={form.desktopImageUrl ? [form.desktopImageUrl] : []}
                                maxImages={1}
                                onImageUploaded={(url) => setForm(prev => ({ ...prev, desktopImageUrl: url }))}
                                onImageRemoved={() => setForm(prev => ({ ...prev, desktopImageUrl: '' }))}
                            />
                        </div>

                        {/* Mobile Image */}
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Smartphone className="w-4 h-4" />
                                Mobile Bild (optional)
                            </div>
                            <p className="text-xs text-gray-500 mb-2">800 × 1200 px empfohlen</p>
                            <ImageUpload
                                existingImages={form.mobileImageUrl ? [form.mobileImageUrl] : []}
                                maxImages={1}
                                onImageUploaded={(url) => setForm(prev => ({ ...prev, mobileImageUrl: url }))}
                                onImageRemoved={() => setForm(prev => ({ ...prev, mobileImageUrl: '' }))}
                            />
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Haupttitel
                            </label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                                placeholder="Premium Beauty"
                            />
                        </div>

                        {/* Subtitle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Untertitel (farbige Zeile)
                            </label>
                            <input
                                name="subtitle"
                                value={form.subtitle}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                                placeholder="für jeden Tag"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Beschreibung
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                                placeholder="Hochwertige Kosmetik von führenden Marken..."
                            />
                        </div>

                        {/* Button */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Button Text
                                </label>
                                <input
                                    name="buttonText"
                                    value={form.buttonText}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                                    placeholder="Zum Shop"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Button Link
                                </label>
                                <input
                                    name="buttonUrl"
                                    value={form.buttonUrl}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                                    placeholder="/catalog"
                                />
                            </div>
                        </div>

                        {/* Active */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={form.isActive}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className="text-sm text-gray-700">
                                Banner auf der Startseite anzeigen
                            </span>
                        </label>

                        {/* Messages */}
                        {saveError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                {saveError}
                            </div>
                        )}
                        {saveSuccess && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                {saveSuccess}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Speichern...
                                </>
                            ) : (
                                <>
                                    Speichern
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="space-y-4">
                        <div className="text-sm font-medium text-gray-700">
                            Vorschau (wie auf der Startseite)
                        </div>

                        {/* Desktop Preview */}
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[16/9]">
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: `url('${form.desktopImageUrl || fallbackImage}')`
                                }}
                            />

                            {/* Overlay gradient - как на реальной странице */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                            {/* Content */}
                            <div className="absolute inset-0 flex items-center p-8">
                                <div className="max-w-md text-white">
                                    {/* Badge */}
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-wider text-white/90 mb-4">
                                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        Neu im Shop
                                    </div>

                                    {/* Title */}
                                    <h2 className="font-serif text-2xl lg:text-3xl font-light leading-tight mb-2">
                                        {form.title || 'Premium Beauty'}
                                        <span className="block mt-1 text-amber-200/90">
                                            {form.subtitle || 'für jeden Tag'}
                                        </span>
                                    </h2>

                                    {/* Description */}
                                    <p className="text-xs text-white/70 leading-relaxed mb-4 line-clamp-2">
                                        {form.description || 'Hochwertige Kosmetik von führenden Marken.'}
                                    </p>

                                    {/* Button */}
                                    {form.buttonText && (
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-xs font-medium">
                                            {form.buttonText}
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            Das ist eine verkleinerte Vorschau. Auf der Startseite wird der Banner
                            deutlich größer dargestellt.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}