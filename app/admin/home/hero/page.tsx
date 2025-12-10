'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { HomeBanner } from '@/lib/types/banner';
import { ArrowRight } from 'lucide-react';

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

            if (!data || data.length === 0) {
                // нет баннера - оставляем форму пустой
                setForm((prev) => ({ ...prev }));
            } else {
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
                setSaveError('Desktop Bild URL ist erforderlich');
                setSaving(false);
                return;
            }

            if (form.id) {
                // update
                const { error } = await supabase
                    .from('home_banners')
                    .update({
                        title: form.title || null,
                        subtitle: form.subtitle || null,
                        description: form.description || null,
                        button_text: form.buttonText || null,
                        button_url: form.buttonUrl || null,
                        desktop_image_url: form.desktopImageUrl,
                        mobile_image_url: form.mobileImageUrl || null,
                        is_active: form.isActive,
                    })
                    .eq('id', form.id);

                if (error) {
                    console.error('Error updating hero banner:', error);
                    setSaveError('Fehler beim Speichern des Banners');
                } else {
                    setSaveSuccess('Banner wurde gespeichert');
                }
            } else {
                // insert
                const { data, error } = await supabase
                    .from('home_banners')
                    .insert({
                        title: form.title || null,
                        subtitle: form.subtitle || null,
                        description: form.description || null,
                        button_text: form.buttonText || null,
                        button_url: form.buttonUrl || null,
                        desktop_image_url: form.desktopImageUrl,
                        mobile_image_url: form.mobileImageUrl || null,
                        is_active: form.isActive,
                    })
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

    const fallbackDesktopImage =
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=1600&fit=crop';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Если у тебя есть общий Header админки - подключи его сюда */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Hero Banner - Startseite
                        </h1>
                        <p className="text-sm text-gray-500">
                            Hier kannst du den großen Banner auf der Startseite bearbeiten.
                        </p>
                    </div>
                    <button
                        onClick={loadBanner}
                        disabled={loading}
                        className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50"
                    >
                        Neu laden
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid gap-6 md:grid-cols-[2fr,1.5fr]"
                >
                    {/* Левая колонка - форма */}
                    <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                        {loading && (
                            <p className="text-sm text-gray-500">Banner wird geladen ...</p>
                        )}

                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">
                                Haupttitel
                            </span>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                placeholder="Premium Beauty"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">
                                Untertitel (farbige Zeile)
                            </span>
                            <input
                                name="subtitle"
                                value={form.subtitle}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                placeholder="für jeden Tag"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">
                                Beschreibung (Text unter dem Titel)
                            </span>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                rows={3}
                                placeholder="Hochwertige Kosmetik von führenden Marken..."
                            />
                        </label>
                        <p className="mt-3 text-xs md:text-sm text-gray-800 max-w-sm">
                            {form.description ||
                                'Hochwertige Kosmetik von führenden Marken, professionell kuratiert.'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm font-medium text-gray-800">
                                    Button Text
                                </span>
                                <input
                                    name="buttonText"
                                    value={form.buttonText}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                    placeholder="Zum Shop"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-gray-800">
                                    Button Link
                                </span>
                                <input
                                    name="buttonUrl"
                                    value={form.buttonUrl}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                    placeholder="/catalog"
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm font-medium text-gray-800">
                                    Desktop Bild URL
                                </span>
                                <input
                                    name="desktopImageUrl"
                                    value={form.desktopImageUrl}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                    placeholder="https://..."
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Empfohlen: 1600 x 600 px
                                </p>
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-gray-800">
                                    Mobile Bild URL
                                </span>
                                <input
                                    name="mobileImageUrl"
                                    value={form.mobileImageUrl}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                    placeholder="optional"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Wenn leer, wird Desktop Bild verwendet
                                </p>
                            </label>

                        </div>

                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={form.isActive}
                                onChange={handleChange}
                                className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-800">
                                Banner auf der Startseite anzeigen
                            </span>
                        </label>

                        {saveError && (
                            <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                {saveError}
                            </div>
                        )}
                        {saveSuccess && (
                            <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                {saveSuccess}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="mt-2 inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {saving ? 'Speichern...' : 'Speichern'}
                            {!saving && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Правая колонка - превью */}
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-800">
                            Vorschau Desktop
                        </div>
                        <div className="relative rounded-2xl border border-gray-200 bg-gray-200 overflow-hidden aspect-[16/7]">
                            <img
                                src={form.desktopImageUrl || fallbackDesktopImage}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-black/40" />
                            <div className="absolute inset-0 flex items-center">
                                <div className="px-6 md:px-10 max-w-md">
                                    <p className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-1 text-[10px] uppercase tracking-[0.16em] text-gray-700 mb-4">
                                        Neu im Shop
                                    </p>
                                    <h2 className="font-serif text-3xl md:text-5xl font-light text-gray-900 leading-[1.05] tracking-tight mb-3">
                                        {form.title || 'Premium Beauty'}
                                        <span className="block mt-2 pb-1 bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 bg-clip-text text-transparent">
                                            {form.subtitle || 'für jeden Tag'}
                                        </span>
                                    </h2>
                                    {form.buttonText && (
                                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-xs font-medium text-white">
                                            {form.buttonText}
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Das ist nur eine Vorschau. Das endgültige Styling hängt vom Layout
                            der Startseite ab.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
