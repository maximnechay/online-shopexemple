'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Tag, Euro, FileText, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import {

    ArrowLeft
} from 'lucide-react';
export default function CreateProduct() {
    const router = useRouter();

    const [form, setForm] = useState({
        name: '',
        price: '',
        compareAtPrice: '',
        images: '',
        category: '',
        description: '',
        stockQuantity: '',
        brand: '',
        tags: '',
        inStock: true,
    });

    const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? value : value,
        }));
    };

    const changeCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: checked,
        }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: form.name,
            price: Number(form.price),
            compareAtPrice: form.compareAtPrice
                ? Number(form.compareAtPrice)
                : null,
            category: form.category,
            description: form.description,
            brand: form.brand || null,
            stockQuantity: form.stockQuantity
                ? Number(form.stockQuantity)
                : 0,
            inStock: form.inStock,
            images: form.images
                ? form.images.split(',').map(i => i.trim()).filter(Boolean)
                : [],
            // можно отправлять строкой — API сам разбирает
            tags: form.tags,
        };

        const res = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
            console.error('Create product error:', data);
            alert(data.error || 'Fehler beim Erstellen des Produkts');
            return;
        }

        router.push('/admin/products');
    };

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-light text-gray-900 mb-10">
                    Neues Produkt hinzufügen
                </h1>
                {/* Back */}
                <Link
                    href="/admin/products"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zur Produktliste
                </Link>
                <form
                    onSubmit={submit}
                    className="space-y-8 bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-sm"
                >

                    {/* Name */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Produktname *
                        </label>
                        <div className="flex items-center gap-3">
                            <Tag className="w-5 h-5 text-gray-500" />
                            <input
                                name="name"
                                value={form.name}
                                onChange={change}
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                placeholder="Vitamin C Serum"
                            />
                        </div>
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Marke
                        </label>
                        <input
                            name="brand"
                            value={form.brand}
                            onChange={change}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                            placeholder="z.B. La Roche-Posay"
                        />
                    </div>

                    {/* Price + CompareAtPrice */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
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
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                    placeholder="49.99"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Alter Preis (€)
                                <span className="text-gray-400 text-xs ml-1">(optional)</span>
                            </label>
                            <input
                                name="compareAtPrice"
                                type="number"
                                step="0.01"
                                value={form.compareAtPrice}
                                onChange={change}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                placeholder="59.99"
                            />
                        </div>
                    </div>

                    {/* Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Lagerbestand
                            </label>
                            <div className="flex items-center gap-3">
                                <PackagePlus className="w-5 h-5 text-gray-500" />
                                <input
                                    name="stockQuantity"
                                    type="number"
                                    value={form.stockQuantity}
                                    onChange={change}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                    placeholder="z.B. 20"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="inStock"
                                    checked={form.inStock}
                                    onChange={changeCheckbox}
                                    className="w-4 h-4"
                                />
                                <span className="text-gray-700 text-sm">
                                    Produkt ist verfügbar
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Kategorie *
                        </label>
                        <input
                            name="category"
                            value={form.category}
                            onChange={change}
                            required
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                            placeholder="face-care / serum / creme ..."
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Bild-URL(s) (kommagetrennt) *
                        </label>

                        <div className="flex items-center gap-3">
                            <ImagePlus className="w-5 h-5 text-gray-500" />
                            <input
                                name="images"
                                value={form.images}
                                onChange={change}
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                placeholder="https://... , https://..."
                            />
                        </div>

                        {form.images && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {form.images
                                    .split(',')
                                    .map((url, i) => url.trim())
                                    .filter(Boolean)
                                    .map((url, i) => (
                                        <div
                                            key={i}
                                            className="w-full h-28 bg-gray-200 rounded-xl overflow-hidden"
                                        >
                                            <img
                                                src={url}
                                                className="object-cover w-full h-full"
                                                alt=""
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Beschreibung
                        </label>
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-gray-500 mt-2" />
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={change}
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black resize-none"
                                placeholder="Produktdetails..."
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Tags (kommagetrennt)
                        </label>
                        <input
                            name="tags"
                            value={form.tags}
                            onChange={change}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                            placeholder="serum, vitamin-c, anti-aging"
                        />
                    </div>

                    <button
                        className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition"
                    >
                        Produkt erstellen
                    </button>
                </form>
            </div>
        </div>
    );
}
