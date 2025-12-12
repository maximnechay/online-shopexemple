'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from '@/components/admin/ImageUpload';
import {
    ArrowLeft,
    ArrowRight,
    Plus,
    Trash2,
    Loader2,
    GripVertical,
    ChevronUp,
    ChevronDown
} from 'lucide-react';

type FormBanner = {
    id?: string;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    sortOrder: number;
    isActive: boolean;
};

export default function AdminMiniBannersPage() {
    const [banners, setBanners] = useState<FormBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadBanners();
    }, []);

    async function loadBanners() {
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('home_mini_banners')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            const mapped =
                data?.map((row) => ({
                    id: row.id,
                    title: row.title || '',
                    description: row.description || '',
                    imageUrl: row.image_url || '',
                    linkUrl: row.link_url || '',
                    sortOrder: row.sort_order ?? 0,
                    isActive: row.is_active ?? true,
                })) || [];

            setBanners(mapped);
        } catch (e) {
            console.error(e);
            setErrorMsg('Fehler beim Laden der Mini Banner');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(index: number, field: keyof FormBanner, value: any) {
        setBanners((prev) =>
            prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
        );
    }

    function addEmptyBanner() {
        setBanners((prev) => [
            ...prev,
            {
                title: '',
                description: '',
                imageUrl: '',
                linkUrl: '',
                sortOrder: prev.length,
                isActive: true,
            },
        ]);
    }

    function moveBanner(index: number, direction: 'up' | 'down') {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === banners.length - 1) return;

        const newBanners = [...banners];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        [newBanners[index], newBanners[swapIndex]] = [newBanners[swapIndex], newBanners[index]];

        // Update sortOrder
        newBanners.forEach((b, i) => {
            b.sortOrder = i;
        });

        setBanners(newBanners);
    }

    async function handleSaveAll() {
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const supabase = createClient();

            for (let i = 0; i < banners.length; i++) {
                const banner = banners[i];
                if (!banner.imageUrl) continue;

                const payload = {
                    title: banner.title || null,
                    description: banner.description || null,
                    image_url: banner.imageUrl,
                    link_url: banner.linkUrl || null,
                    sort_order: i,
                    is_active: banner.isActive,
                };

                if (banner.id) {
                    const { error } = await supabase
                        .from('home_mini_banners')
                        .update(payload)
                        .eq('id', banner.id);

                    if (error) throw error;
                } else {
                    const { data, error } = await supabase
                        .from('home_mini_banners')
                        .insert(payload)
                        .select()
                        .single();

                    if (error) throw error;

                    banner.id = data.id;
                }
            }

            setSuccessMsg('Mini Banner wurden gespeichert');
        } catch (e) {
            console.error(e);
            setErrorMsg('Fehler beim Speichern der Mini Banner');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(index: number) {
        const banner = banners[index];

        if (banner.id) {
            try {
                const supabase = createClient();
                const { error } = await supabase
                    .from('home_mini_banners')
                    .delete()
                    .eq('id', banner.id);

                if (error) throw error;
            } catch (e) {
                console.error(e);
                setErrorMsg('Fehler beim Löschen des Banners');
                return;
            }
        }

        setBanners((prev) => prev.filter((_, i) => i !== index));
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-5xl mx-auto">
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
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-light text-gray-900 mb-2">Mini-Banner</h1>
                        <p className="text-gray-600">
                            Kleine Promo-Banner unter den Kategorien. Maximal 3 empfohlen.
                        </p>
                    </div>
                    <button
                        onClick={addEmptyBanner}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Banner hinzufügen
                    </button>
                </div>

                {/* Messages */}
                {errorMsg && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {successMsg}
                    </div>
                )}

                {/* Banners List */}
                {banners.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">
                            Noch keine Mini Banner vorhanden.
                        </p>
                        <button
                            onClick={addEmptyBanner}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Ersten Banner hinzufügen
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {banners.map((banner, index) => (
                            <div
                                key={banner.id || `new-${index}`}
                                className="bg-gray-50 rounded-2xl border border-gray-200 p-6"
                            >
                                {/* Banner Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                type="button"
                                                onClick={() => moveBanner(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveBanner(index, 'down')}
                                                disabled={index === banners.length - 1}
                                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <span className="text-lg font-medium text-gray-900">
                                            Banner {index + 1}
                                        </span>
                                        {!banner.isActive && (
                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                                                Inaktiv
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(index)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Löschen
                                    </button>
                                </div>

                                <div className="grid lg:grid-cols-[1fr,1.2fr] gap-6">
                                    {/* Left - Image Upload */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Bild *
                                        </p>
                                        <p className="text-xs text-gray-500 mb-2">
                                            800 × 400 px empfohlen (Querformat)
                                        </p>
                                        <ImageUpload
                                            existingImages={banner.imageUrl ? [banner.imageUrl] : []}
                                            maxImages={1}
                                            onImageUploaded={(url) => handleChange(index, 'imageUrl', url)}
                                            onImageRemoved={() => handleChange(index, 'imageUrl', '')}
                                        />
                                    </div>

                                    {/* Right - Form Fields */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Titel
                                            </label>
                                            <input
                                                value={banner.title}
                                                onChange={(e) => handleChange(index, 'title', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                                                placeholder="z.B. Haarverlängerung"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Beschreibung
                                            </label>
                                            <textarea
                                                value={banner.description}
                                                onChange={(e) => handleChange(index, 'description', e.target.value)}
                                                rows={2}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                                                placeholder="Kurzer Text unter dem Titel"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Link
                                            </label>
                                            <input
                                                value={banner.linkUrl}
                                                onChange={(e) => handleChange(index, 'linkUrl', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                                                placeholder="/catalog oder /kategorie/..."
                                            />
                                        </div>

                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={banner.isActive}
                                                onChange={(e) => handleChange(index, 'isActive', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                                            />
                                            <span className="text-sm text-gray-700">
                                                Auf Startseite anzeigen
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Preview */}
                                {banner.imageUrl && (
                                    <div className="mt-6">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Vorschau</p>

                                        <div className="group relative overflow-hidden rounded-3xl bg-gray-100 border border-gray-100 h-48 max-w-md">
                                            {/* Фон */}
                                            <div
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                                style={{ backgroundImage: `url('${banner.imageUrl}')` }}
                                            />

                                            {/* Узкий градиент только слева */}
                                            <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                                            {/* Контент */}
                                            <div className="relative h-full px-5 py-4 flex flex-col justify-between text-white max-w-[60%]">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 mb-1">
                                                        Empfehlung
                                                    </p>
                                                    <h3 className="text-lg font-medium leading-snug">
                                                        {banner.title || 'Kategorie'}
                                                    </h3>
                                                    {banner.description && (
                                                        <p className="mt-1 text-xs text-white/80 line-clamp-5   ">
                                                            {banner.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-white/90">
                                                    Jetzt entdecken
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>
                )}

                {/* Save Button */}
                {banners.length > 0 && (
                    <div className="mt-8">
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Speichern...
                                </>
                            ) : (
                                <>
                                    Alle speichern
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}