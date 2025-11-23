// app/admin/products/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Tag, Euro, ImagePlus, FileText, PackagePlus, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FormState {
    name: string;
    price: string;
    images: string;
    category: string;
    description: string;
    stock_quantity: string;
    in_stock: boolean;
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [form, setForm] = useState<FormState>({
        name: '',
        price: '',
        images: '',
        category: '',
        description: '',
        stock_quantity: '',
        in_stock: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Загрузка товара
    useEffect(() => {
        if (!id) return;

        const load = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/admin/products/${id}`);

                if (!res.ok) {
                    throw new Error('Produkt konnte nicht geladen werden');
                }

                const data = await res.json();

                setForm({
                    name: data.name ?? '',
                    price: data.price != null ? String(data.price) : '',
                    images: Array.isArray(data.images)
                        ? data.images.join(', ')
                        : (data.images || ''),
                    category: data.category ?? '',
                    description: data.description ?? '',
                    stock_quantity:
                        data.stock_quantity != null
                            ? String(data.stock_quantity)
                            : '',
                    in_stock: data.in_stock ?? true,
                });
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Fehler beim Laden des Produkts');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const change = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const toggleInStock = () => {
        setForm(prev => ({ ...prev, in_stock: !prev.in_stock }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const payload = {
                name: form.name.trim(),
                price: Number(form.price),
                category: form.category.trim(),
                description: form.description.trim(),
                stock_quantity: form.stock_quantity
                    ? Number(form.stock_quantity)
                    : 0,
                in_stock: form.in_stock,
                images: form.images
                    ? form.images.split(',').map(i => i.trim())
                    : [],
            };

            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });


            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                    data.error || 'Fehler beim Speichern des Produkts'
                );
            }

            router.push('/admin/products');
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
                    <div className="h-8 w-52 bg-gray-100 rounded mb-6 animate-pulse" />
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
                    href="/admin/products"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zur Produktliste
                </Link>

                <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-10 tracking-tight">
                    Produkt bearbeiten
                </h1>

                <form
                    onSubmit={submit}
                    className="space-y-8 bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm"
                >
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Produktname *
                        </label>
                        <div className="flex items-center gap-3">
                            <Tag className="w-5 h-5 text-gray-500" />
                            <input
                                name="name"
                                value={form.name}
                                onChange={change}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Vitamin C Serum"
                            />
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preis (€) *
                        </label>
                        <div className="flex items-center gap-3">
                            <Euro className="w-5 h-5 text-gray-500" />
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                value={form.price}
                                onChange={change}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Stock + In stock toggle */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lagerbestand
                            </label>
                            <div className="flex items-center gap-3">
                                <PackagePlus className="w-5 h-5 text-gray-500" />
                                <input
                                    name="stock_quantity"
                                    type="number"
                                    value={form.stock_quantity}
                                    onChange={change}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Wenn leer, wird automatisch 0 gesetzt.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Verfügbar
                            </label>
                            <button
                                type="button"
                                onClick={toggleInStock}
                                className="inline-flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition"
                            >
                                {form.in_stock ? (
                                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                                )}
                                <span className="text-sm text-gray-800">
                                    {form.in_stock
                                        ? 'Produkt ist verfügbar'
                                        : 'Produkt ist nicht verfügbar'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kategorie *
                        </label>
                        <input
                            name="category"
                            value={form.category}
                            onChange={change}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="serum, creme, shampoo..."
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bild-URL(s) (durch Komma getrennt)
                        </label>
                        <div className="flex items-center gap-3">
                            <ImagePlus className="w-5 h-5 text-gray-500" />
                            <input
                                name="images"
                                value={form.images}
                                onChange={change}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="https://... , https://..."
                            />
                        </div>
                        {form.images && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                                {form.images.split(',').map((url, i) => (
                                    <div
                                        key={i}
                                        className="w-full aspect-[4/5] bg-gray-200 rounded-2xl overflow-hidden"
                                    >
                                        <img
                                            src={url.trim()}
                                            className="w-full h-full object-cover"
                                            alt={`Preview ${i + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Beschreibung
                        </label>
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-gray-500 mt-2" />
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={change}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Speichern...' : 'Änderungen speichern'}
                    </button>
                </form>
            </div>
        </div>
    );
}
