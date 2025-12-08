'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Euro, FileText, PackagePlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCategories } from '@/lib/hooks/useCategories';
import ImageUpload from '@/components/admin/ImageUpload';
import { apiPost } from '@/lib/api/client';
import { Attribute } from '@/lib/types/attributes';

export default function CreateProduct() {
    const router = useRouter();
    const { categories } = useCategories();

    // Отдельный state для изображений
    const [images, setImages] = useState<string[]>([]);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [selectedAttributes, setSelectedAttributes] = useState<{ [attributeId: string]: string | string[] }>({});

    const [form, setForm] = useState({
        name: '',
        price: '',
        compareAtPrice: '',
        category: '',
        description: '',
        stockQuantity: '',
        brand: '',
        tags: '',
        inStock: true,
    });

    // Load attributes
    useEffect(() => {
        const loadAttributes = async () => {
            try {
                const res = await fetch('/api/admin/attributes');
                const data = await res.json();
                setAttributes(data || []);
            } catch (e) {
                console.error('Error loading attributes:', e);
            }
        };
        loadAttributes();
    }, []);

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

    const handleImageUploaded = (url: string) => {
        setImages(prev => [...prev, url]);
        console.log('✅ Image uploaded:', url);
    };

    const handleImageRemoved = (url: string) => {
        setImages(prev => prev.filter(img => img !== url));
        console.log('🗑️ Image removed:', url);
    };

    const handleAttributeChange = (attributeId: string, value: string | string[], isMultiselect: boolean) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attributeId]: value,
        }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Валидация: должно быть хотя бы одно изображение
        if (images.length === 0) {
            alert('Bitte laden Sie mindestens ein Bild hoch');
            return;
        }

        const payload = {
            name: form.name,
            price: Number(form.price),
            compare_at_price: form.compareAtPrice
                ? Number(form.compareAtPrice)
                : null,
            category: form.category,
            description: form.description,
            brand: form.brand || null,
            stock_quantity: form.stockQuantity
                ? Number(form.stockQuantity)
                : 0,
            in_stock: form.inStock,
            images: images.length > 0 ? images : null, // Массив URL или null
            tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null, // Преобразуем строку в массив
        };

        try {
            const data = await apiPost('/api/admin/products', payload);
            console.log('✅ Product created:', data);
            console.log('📝 Selected attributes:', selectedAttributes);

            // Save product attributes
            if (Object.keys(selectedAttributes).length > 0) {
                const productId = data.id;
                console.log('💾 Saving attributes for product:', productId);

                const attributePromises = Object.entries(selectedAttributes).map(([attributeId, value]) => {
                    if (Array.isArray(value)) {
                        // Multiselect - create multiple entries
                        console.log('  📋 Multiselect attribute:', attributeId, 'values:', value);
                        return Promise.all(
                            value.map(valueId =>
                                apiPost('/api/admin/products/attributes', {
                                    productId,
                                    attributeId,
                                    attributeValueId: valueId,
                                })
                            )
                        );
                    } else if (value) {
                        // Single select
                        console.log('  📌 Single attribute:', attributeId, 'value:', value);
                        return apiPost('/api/admin/products/attributes', {
                            productId,
                            attributeId,
                            attributeValueId: value,
                        });
                    }
                });

                await Promise.all(attributePromises);
                console.log('✅ All attributes saved');
            } else {
                console.log('⚠️ No attributes selected');
            }

            router.push('/admin/products');
            router.refresh();
        } catch (error: any) {
            console.error('Create product error:', error);
            alert(error.message || 'Fehler beim Erstellen des Produkts');
        }
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
                        <select
                            name="category"
                            value={form.category}
                            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                            required
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black bg-white"
                        >
                            <option value="">-- Kategorie wählen --</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ========== IMAGE UPLOAD COMPONENT ========== */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-3">
                            Produktbilder *
                        </label>

                        <p className="text-sm text-gray-600 mb-4">
                            Das erste Bild wird als Hauptbild verwendet. Sie können bis zu 5 Bilder hochladen.
                        </p>

                        <ImageUpload
                            onImageUploaded={handleImageUploaded}
                            onImageRemoved={handleImageRemoved}
                            existingImages={images}
                            maxImages={5}
                        />

                        {images.length === 0 && (
                            <p className="mt-3 text-sm text-amber-600">
                                ⚠️ Bitte laden Sie mindestens ein Bild hoch
                            </p>
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

                    {/* Attributes */}
                    {attributes.length > 0 && (
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Produktattribute
                            </h3>
                            <div className="space-y-4">
                                {attributes.map((attr) => (
                                    <div key={attr.id}>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            {attr.name}
                                        </label>
                                        {attr.type === 'select' && (
                                            <select
                                                value={(selectedAttributes[attr.id] as string) || ''}
                                                onChange={(e) => handleAttributeChange(attr.id, e.target.value, false)}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black bg-white"
                                            >
                                                <option value="">-- {attr.name} wählen --</option>
                                                {attr.values?.map((val) => (
                                                    <option key={val.id} value={val.id}>
                                                        {val.value}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {attr.type === 'multiselect' && (
                                            <div className="space-y-2">
                                                {attr.values?.map((val) => (
                                                    <label key={val.id} className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={(selectedAttributes[attr.id] as string[] || []).includes(val.id)}
                                                            onChange={(e) => {
                                                                const current = (selectedAttributes[attr.id] as string[]) || [];
                                                                const newValue = e.target.checked
                                                                    ? [...current, val.id]
                                                                    : current.filter(id => id !== val.id);
                                                                handleAttributeChange(attr.id, newValue, true);
                                                            }}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-gray-700 text-sm">{val.value}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {attr.type === 'boolean' && (
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAttributes[attr.id] === 'true'}
                                                    onChange={(e) => handleAttributeChange(attr.id, e.target.checked ? 'true' : 'false', false)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-gray-700 text-sm">Ja</span>
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={images.length === 0}
                        className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Produkt erstellen
                    </button>
                </form>
            </div>
        </div>
    );
}