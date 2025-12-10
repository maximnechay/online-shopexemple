'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { HomeMiniBanner } from '@/lib/types/miniBanner';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';

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

    async function handleSaveAll() {
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const supabase = createClient();

            for (const banner of banners) {
                if (!banner.imageUrl) continue; // пустые пропускаем

                if (banner.id) {
                    const { error } = await supabase
                        .from('home_mini_banners')
                        .update({
                            title: banner.title || null,
                            description: banner.description || null,
                            image_url: banner.imageUrl,
                            link_url: banner.linkUrl || null,
                            sort_order: banner.sortOrder ?? 0,
                            is_active: banner.isActive,
                        })
                        .eq('id', banner.id);

                    if (error) throw error;
                } else {
                    const { data, error } = await supabase
                        .from('home_mini_banners')
                        .insert({
                            title: banner.title || null,
                            description: banner.description || null,
                            image_url: banner.imageUrl,
                            link_url: banner.linkUrl || null,
                            sort_order: banner.sortOrder ?? 0,
                            is_active: banner.isActive,
                        })
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

    async function handleDelete(id?: string) {
        if (!id) {
            // локально добавленный, просто убираем
            setBanners((prev) => prev.filter((b) => b.id !== id));
            return;
        }

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('home_mini_banners')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setBanners((prev) => prev.filter((b) => b.id !== id));
        } catch (e) {
            console.error(e);
            setErrorMsg('Fehler beim Löschen des Banners');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Mini Banner - Startseite
                        </h1>
                        <p className="text-sm text-gray-500">
                            Kleine Banner unter dem Hero Bereich. Maximal 3 empfehlen sich.
                        </p>
                    </div>
                    <button
                        onClick={addEmptyBanner}
                        className="inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
                    >
                        <Plus className="w-4 h-4" />
                        Mini Banner hinzufügen
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {successMsg}
                    </div>
                )}

                {loading ? (
                    <p className="text-sm text-gray-500">Wird geladen ...</p>
                ) : banners.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Noch keine Mini Banner vorhanden. Füge den ersten hinzu.
                    </p>
                ) : (
                    <div className="space-y-6">
                        {banners.map((banner, index) => (
                            <div
                                key={banner.id || index}
                                className="grid md:grid-cols-[2fr,1.5fr,auto] gap-4 items-stretch rounded-2xl bg-white p-4 border border-gray-100 shadow-sm"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <label className="flex-1">
                                            <span className="text-xs font-medium text-gray-700">
                                                Titel
                                            </span>
                                            <input
                                                value={banner.title}
                                                onChange={(e) =>
                                                    handleChange(index, 'title', e.target.value)
                                                }
                                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                                placeholder="Zum Beispiel: Haarverlängerung"
                                            />
                                        </label>
                                        <label className="w-20">
                                            <span className="text-xs font-medium text-gray-700">
                                                Reihenfolge
                                            </span>
                                            <input
                                                type="number"
                                                value={banner.sortOrder}
                                                onChange={(e) =>
                                                    handleChange(
                                                        index,
                                                        'sortOrder',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                            />
                                        </label>
                                    </div>

                                    <label className="block">
                                        <span className="text-xs font-medium text-gray-700">
                                            Beschreibung
                                        </span>
                                        <textarea
                                            value={banner.description}
                                            onChange={(e) =>
                                                handleChange(index, 'description', e.target.value)
                                            }
                                            rows={2}
                                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                            placeholder="Kurzer Text unter dem Titel"
                                        />
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="block">
                                            <span className="text-xs font-medium text-gray-700">
                                                Link
                                            </span>
                                            <input
                                                value={banner.linkUrl}
                                                onChange={(e) =>
                                                    handleChange(index, 'linkUrl', e.target.value)
                                                }
                                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                                placeholder="/catalog oder /services/haarverlangerung"
                                            />
                                        </label>

                                        <label className="inline-flex items-center gap-2 mt-6">
                                            <input
                                                type="checkbox"
                                                checked={banner.isActive}
                                                onChange={(e) =>
                                                    handleChange(index, 'isActive', e.target.checked)
                                                }
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-xs text-gray-800">
                                                Aktiv auf Startseite
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Bild url + preview */}
                                <div className="space-y-3">
                                    <label className="block">
                                        <span className="text-xs font-medium text-gray-700">
                                            Bild URL
                                        </span>
                                        <input
                                            value={banner.imageUrl}
                                            onChange={(e) =>
                                                handleChange(index, 'imageUrl', e.target.value)
                                            }
                                            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                            placeholder="https://..."
                                        />
                                        <p className="mt-1 text-[11px] text-gray-500">
                                            Empfohlen: Querformat, ca. 800 x 400 px
                                        </p>
                                    </label>

                                    <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-28 border border-gray-100">
                                        {banner.imageUrl ? (
                                            <img
                                                src={banner.imageUrl}
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                                Keine Vorschau
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-black/5" />
                                        <div className="absolute bottom-2 left-3 right-3 text-[11px] text-white flex items-center justify-between">
                                            <span className="truncate">
                                                {banner.title || 'Titel Vorschau'}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                Jetzt entdecken
                                                <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(banner.id)}
                                        className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Löschen
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6">
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {saving ? 'Speichern...' : 'Alle speichern'}
                        {!saving && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
