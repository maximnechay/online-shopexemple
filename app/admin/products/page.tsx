'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, PlusCircle, Package, Image } from 'lucide-react';

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);

    const load = async () => {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        setProducts(data);
    };

    const remove = async (id: string) => {
        if (!confirm('Produkt wirklich löschen?')) return;
        await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        load();
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-6xl mx-auto">

                <div className="flex justify-between items-center mb-14">
                    <h1 className="text-4xl font-light text-gray-900">Produkte verwalten</h1>

                    <Link
                        href="/admin/products/create"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition shadow"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Neues Produkt
                    </Link>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {products.map((p: any) => (
                        <div
                            key={p.id}
                            className="bg-gray-50 p-6 border border-gray-200 rounded-3xl hover:bg-white hover:shadow-xl transition"
                        >
                            <div className="flex gap-6">

                                {/* Image preview */}
                                <div className="w-32 h-32 bg-white rounded-xl border overflow-hidden flex items-center justify-center">
                                    {p.images?.[0] ? (
                                        <img
                                            src={p.images[0]}
                                            alt={p.name}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <Image className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                        {p.name}
                                    </h2>

                                    <p className="text-gray-700 mb-2">
                                        {p.price} €
                                    </p>

                                    <p className="text-sm text-gray-500 mb-4">
                                        Kategorie: {p.category}
                                    </p>

                                    {/* Stock */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <Package className="w-5 h-5 text-gray-600" />
                                        <span className="text-gray-700 font-medium">
                                            Lager: {p.stock_quantity ?? 0} Stk
                                        </span>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link
                                            href={`/admin/products/${p.id}/edit`}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Bearbeiten
                                        </Link>

                                        <button
                                            onClick={() => remove(p.id)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Löschen
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
