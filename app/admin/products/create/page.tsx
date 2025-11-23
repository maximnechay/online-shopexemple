'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Tag, Euro, FileText, PackagePlus } from 'lucide-react';

export default function CreateProduct() {
    const router = useRouter();

    const [form, setForm] = useState({
        name: '',
        price: '',
        images: '',
        category: '',
        description: '',
        stock_quantity: '',
    });

    const change = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const submit = async (e: any) => {
        e.preventDefault();

        const payload = {
            ...form,
            price: Number(form.price),
            stock_quantity: Number(form.stock_quantity || 0),
            images: form.images.split(',').map((i) => i.trim()),
        };

        await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        router.push('/admin/products');
    };

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-3xl mx-auto">

                <h1 className="text-4xl font-light text-gray-900 mb-10">
                    Neues Produkt hinzufügen
                </h1>

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
                                onChange={change}
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                placeholder="Vitamin C Serum"
                            />
                        </div>
                    </div>

                    {/* Price */}
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
                                onChange={change}
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                placeholder="49.99"
                            />
                        </div>
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Lagerbestand
                        </label>
                        <div className="flex items-center gap-3">
                            <PackagePlus className="w-5 h-5 text-gray-500" />
                            <input
                                name="stock_quantity"
                                type="number"
                                onChange={change}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                placeholder="z.B. 20"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Kategorie *
                        </label>
                        <input
                            name="category"
                            onChange={change}
                            required
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                            placeholder="serum / creme / make-up"
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
                                onChange={change}
                                required
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                placeholder="https://... , https://..."
                            />
                        </div>

                        {/* Preview */}
                        {form.images && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {form.images.split(',').map((url, i) => (
                                    <div
                                        key={i}
                                        className="w-full h-28 bg-gray-200 rounded-xl overflow-hidden"
                                    >
                                        <img
                                            src={url.trim()}
                                            className="object-cover w-full h-full"
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
                                onChange={change}
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black resize-none"
                                placeholder="Produktdetails..."
                            />
                        </div>
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
