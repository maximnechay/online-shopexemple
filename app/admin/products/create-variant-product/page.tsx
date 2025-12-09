// app/admin/products/create-variant-product/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { apiPost } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/lib/hooks/useCategories';
import ImageUpload from '@/components/admin/ImageUpload';

interface AttributeValue {
    id: string;
    value: string;
}

interface Attribute {
    id: string;
    name: string;
    slug: string;
    type: string;
    values: AttributeValue[];
}

interface VariantAttribute {
    attributeId: string;
    attributeValueId?: string;
    customValue?: string;
}

interface Variant {
    id: string;
    name: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    stockQuantity: number;
    images: string[];
    attributes: Record<string, { valueId?: string; customValue?: string }>;
}

export default function CreateVariantProductPage() {
    const router = useRouter();
    const { categories } = useCategories();
    const [loading, setLoading] = useState(false);
    const [loadingAttributes, setLoadingAttributes] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attributes, setAttributes] = useState<Attribute[]>([]);

    // Parent product data
    const [productName, setProductName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [tags, setTags] = useState('');

    // Variants
    const [variants, setVariants] = useState<Variant[]>([
        {
            id: crypto.randomUUID(),
            name: '',
            sku: '',
            price: 0,
            compareAtPrice: 0,
            stockQuantity: 0,
            images: [],
            attributes: {}
        }
    ]);

    const loadAttributes = async () => {
        try {
            setLoadingAttributes(true);
            const res = await fetch('/api/admin/attributes');
            const data = await res.json();
            setAttributes(data || []);
        } catch (err) {
            console.error('Error loading attributes:', err);
            setError('Fehler beim Laden der Attribute');
        } finally {
            setLoadingAttributes(false);
        }
    };
    useEffect(() => {
        loadAttributes();
    }, []);
    // Parent product image handlers
    const handleParentImageUploaded = (url: string) => {
        setImages(prev => [...prev, url]);
    };

    const handleParentImageRemoved = (url: string) => {
        setImages(prev => prev.filter(img => img !== url));
    };

    // Variant image handlers
    const handleVariantImageUploaded = (variantId: string, url: string) => {
        setVariants(variants.map(v => {
            if (v.id === variantId) {
                return { ...v, images: [...v.images, url] };
            }
            return v;
        }));
    };

    const handleVariantImageRemoved = (variantId: string, url: string) => {
        setVariants(variants.map(v => {
            if (v.id === variantId) {
                return { ...v, images: v.images.filter(img => img !== url) };
            }
            return v;
        }));
    };

    const addVariant = () => {
        setVariants([
            ...variants,
            {
                id: crypto.randomUUID(),
                name: '',
                sku: '',
                price: 0,
                compareAtPrice: 0,
                stockQuantity: 0,
                images: [],
                attributes: {}
            }
        ]);
    };

    const removeVariant = (id: string) => {
        if (variants.length > 1) {
            setVariants(variants.filter(v => v.id !== id));
        }
    };

    const updateVariant = (id: string, field: keyof Variant, value: any) => {
        setVariants(variants.map(v =>
            v.id === id ? { ...v, [field]: value } : v
        ));
    };

    const updateVariantAttribute = (
        variantId: string,
        attributeSlug: string,
        valueId?: string,
        customValue?: string
    ) => {
        setVariants(variants.map(v => {
            if (v.id === variantId) {
                return {
                    ...v,
                    attributes: {
                        ...v.attributes,
                        [attributeSlug]: { valueId, customValue }
                    }
                };
            }
            return v;
        }));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleProductNameChange = (name: string) => {
        setProductName(name);
        if (!slug) {
            setSlug(generateSlug(name));
        }
    };
    const generateSKU = (variant: Variant) => {
        // Префикс бренда
        const brandPrefix = brand.slice(0, 3).toUpperCase();

        // Собираем значения атрибутов
        const attrParts: string[] = [];

        Object.entries(variant.attributes).forEach(([slug, attrData]) => {
            const attribute = attributes.find(a => a.slug === slug);
            if (!attribute) return;

            let value = '';

            // Если выбрано значение из списка
            if (attrData.valueId) {
                const attrValue = attribute.values.find(v => v.id === attrData.valueId);
                value = attrValue?.value || '';
            }
            // Если введен custom value
            else if (attrData.customValue) {
                value = attrData.customValue;
            }

            if (value) {
                // Очищаем значение от спецсимволов и делаем uppercase
                const cleanValue = value
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toUpperCase()
                    .slice(0, 6); // Максимум 6 символов

                if (cleanValue) {
                    attrParts.push(cleanValue);
                }
            }
        });

        // Если атрибутов нет, добавляем случайный код
        if (attrParts.length === 0) {
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            return `${brandPrefix}-${randomCode}`;
        }

        return `${brandPrefix}-${attrParts.join('-')}`;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!productName || !slug || !category || variants.length === 0) {
            setError('Bitte füllen Sie alle Pflichtfelder aus');
            return;
        }

        if (images.length === 0) {
            setError('Bitte laden Sie mindestens ein Bild für das Produkt hoch');
            return;
        }

        for (const variant of variants) {
            if (!variant.name || !variant.sku || variant.price <= 0) {
                setError('Alle Varianten müssen Name, SKU und Preis haben');
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);

            const variantsData = variants.map(v => {
                const variantAttributes: VariantAttribute[] = [];

                // Convert attributes object to array
                Object.entries(v.attributes).forEach(([slug, attrData]) => {
                    const attribute = attributes.find(a => a.slug === slug);
                    if (attribute && (attrData.valueId || attrData.customValue)) {
                        variantAttributes.push({
                            attributeId: attribute.id,
                            attributeValueId: attrData.valueId,
                            customValue: attrData.customValue
                        });
                    }
                });

                return {
                    name: v.name,
                    sku: v.sku,
                    price: v.price,
                    compareAtPrice: v.compareAtPrice || undefined,
                    stockQuantity: v.stockQuantity,
                    images: v.images.length > 0 ? v.images : images, // Use parent images if no variant images
                    attributes: variantAttributes
                };
            });

            await apiPost('/api/admin/products/create-with-variants', {
                name: productName,
                slug,
                description,
                category,
                brand,
                images: images,
                tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                variants: variantsData
            });

            router.push('/admin/products');
            router.refresh();
        } catch (err: any) {
            console.error('Error creating product:', err);
            setError(err.message || 'Fehler beim Erstellen des Produkts');
        } finally {
            setLoading(false);
        }
    };

    if (loadingAttributes) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                    <p className="text-gray-600">Attribute werden geladen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <Link
                    href="/admin/products"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zu Produkten
                </Link>

                <h1 className="text-3xl font-light text-gray-900 mb-8">
                    Produkt mit Varianten erstellen
                </h1>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Parent Product Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-medium text-gray-900 mb-6">
                            Produkt-Informationen
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Produktname *
                                </label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => handleProductNameChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="z.B. BELLAMI Flex Weft Hair Extensions"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Slug *
                                </label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="bellami-flex-weft-hair-extensions"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Beschreibung
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kategorie *
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">-- Kategorie wählen --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Marke
                                    </label>
                                    <input
                                        type="text"
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tags (kommagetrennt)
                                </label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="flexweft, hair-extensions"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Produktbilder *
                                </label>
                                <p className="text-sm text-gray-600 mb-4">
                                    Das erste Bild wird als Hauptbild verwendet. Varianten können eigene Bilder haben.
                                </p>
                                <ImageUpload
                                    onImageUploaded={handleParentImageUploaded}
                                    onImageRemoved={handleParentImageRemoved}
                                    existingImages={images}
                                    maxImages={5}
                                />
                                {images.length === 0 && (
                                    <p className="mt-3 text-sm text-amber-600">
                                        ⚠️ Bitte laden Sie mindestens ein Bild hoch
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-medium text-gray-900">
                                Varianten ({variants.length})
                            </h2>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Variante hinzufügen
                            </button>
                        </div>

                        <div className="space-y-6">
                            {variants.map((variant, index) => (
                                <div
                                    key={variant.id}
                                    className="p-4 border-2 border-gray-200 rounded-xl"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium text-gray-900">
                                            Variante {index + 1}
                                        </h3>
                                        {variants.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeVariant(variant.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={variant.name}
                                                    onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder='16" 120g Golden Blonde #610'
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    SKU *
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={variant.sku}
                                                        onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="BFLX-16-120-610"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newSKU = generateSKU(variant);
                                                            updateVariant(variant.id, 'sku', newSKU);
                                                        }}
                                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm whitespace-nowrap"
                                                    >
                                                        Auto
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Preis * (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={variant.price}
                                                    onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Vergleichspreis (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={variant.compareAtPrice || ''}
                                                    onChange={(e) => updateVariant(variant.id, 'compareAtPrice', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Lagerbestand
                                                </label>
                                                <input
                                                    type="number"
                                                    value={variant.stockQuantity}
                                                    onChange={(e) => updateVariant(variant.id, 'stockQuantity', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Variant Attributes */}
                                        {attributes.length > 0 && (
                                            <div className="border-t border-gray-200 pt-4 mt-4">
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">
                                                    Varianten-Attribute
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {attributes.map((attribute) => (
                                                        <div key={attribute.id}>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {attribute.name}
                                                            </label>
                                                            {attribute.values && attribute.values.length > 0 ? (
                                                                <select
                                                                    value={variant.attributes[attribute.slug]?.valueId || ''}
                                                                    onChange={(e) => {
                                                                        if (e.target.value === 'custom') {
                                                                            updateVariantAttribute(variant.id, attribute.slug, undefined, '');
                                                                        } else if (e.target.value) {
                                                                            updateVariantAttribute(variant.id, attribute.slug, e.target.value, undefined);
                                                                        }
                                                                    }}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                                                >
                                                                    <option value="">Auswählen...</option>
                                                                    {attribute.values.map((value) => (
                                                                        <option key={value.id} value={value.id}>
                                                                            {value.value}
                                                                        </option>
                                                                    ))}
                                                                    <option value="custom">Eigenen Wert eingeben...</option>
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={variant.attributes[attribute.slug]?.customValue || ''}
                                                                    onChange={(e) => updateVariantAttribute(variant.id, attribute.slug, undefined, e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                                    placeholder={`${attribute.name} eingeben`}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Variant Images (optional) */}
                                        <div className="border-t border-gray-200 pt-4 mt-4">
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                Varianten-spezifische Bilder (optional)
                                            </h4>
                                            <p className="text-xs text-gray-500 mb-3">
                                                Falls nicht hochgeladen, werden die Hauptprodukt-Bilder verwendet
                                            </p>
                                            <ImageUpload
                                                onImageUploaded={(url) => handleVariantImageUploaded(variant.id, url)}
                                                onImageRemoved={(url) => handleVariantImageRemoved(variant.id, url)}
                                                existingImages={variant.images}
                                                maxImages={3}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Link
                            href="/admin/products"
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                        >
                            Abbrechen
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || images.length === 0}
                            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Erstellen...' : 'Produkt erstellen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}