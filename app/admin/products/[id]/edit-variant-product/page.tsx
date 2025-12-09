'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { apiPut } from '@/lib/api/client';
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
    compareAtPrice?: number | null;
    stockQuantity: number;
    images: string[];
    inStock: boolean;
    isActive: boolean;
    attributes: Record<string, { valueId?: string; customValue?: string }>;
}

interface LoadedProduct {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string;
    brand: string | null;
    images: string[];
    tags: string[];
    variants: Array<{
        id: string;
        productId: string;
        sku: string;
        name: string;
        price: number;
        compareAtPrice: number | null;
        stockQuantity: number;
        inStock: boolean;
        images: string[];
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    variantAttributes?: Record<
        string,
        Array<{
            attributeId: string;
            attributeValueId: string | null;
            customValue: string | null;
        }>
    >;
}

export default function EditVariantProductPage() {
    const router = useRouter();
    const params = useParams() as { id: string };
    const { categories } = useCategories();

    const [loading, setLoading] = useState(true);
    const [loadingAttributes, setLoadingAttributes] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [productData, setProductData] = useState<LoadedProduct | null>(null);

    // parent product
    const [productName, setProductName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('BELLAMI');
    const [images, setImages] = useState<string[]>([]);
    const [tags, setTags] = useState('');

    // variants
    const [variants, setVariants] = useState<Variant[]>([]);

    // 1. грузим атрибуты и продукт
    useEffect(() => {
        const fetchAll = async () => {
            setError(null);
            await Promise.all([loadAttributes(), loadProduct()]);
            setLoading(false);
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const loadAttributes = async () => {
        try {
            setLoadingAttributes(true);
            const res = await fetch('/api/admin/attributes');
            if (!res.ok) throw new Error('Failed to load attributes');
            const data = await res.json();
            setAttributes(data || []);
        } catch (err) {
            console.error('Error loading attributes:', err);
            setError('Fehler beim Laden der Attribute');
        } finally {
            setLoadingAttributes(false);
        }
    };

    const loadProduct = async () => {
        try {
            const res = await fetch(`/api/admin/products/${params.id}`);
            if (!res.ok) throw new Error('Failed to load product');
            const product: LoadedProduct = await res.json();

            setProductName(product.name || '');
            setSlug(product.slug || '');
            setDescription(product.description || '');
            setCategory(product.category || '');
            setBrand(product.brand || '');
            setImages(product.images || []);
            setTags(product.tags?.join(', ') || '');

            setProductData(product);
        } catch (err) {
            console.error('Error loading product:', err);
            setError('Fehler beim Laden des Produkts');
        }
    };

    // 2. когда есть productData + attributes — собираем variants с атрибутами по slug
    useEffect(() => {
        if (!productData) return;

        const mappedVariants: Variant[] = (productData.variants || []).map(v => {
            const rawAttrs = productData.variantAttributes?.[v.id] || [];

            const attrsBySlug: Record<string, { valueId?: string; customValue?: string }> = {};

            rawAttrs.forEach(va => {
                const meta = attributes.find(a => a.id === va.attributeId);
                if (!meta) return;

                if (va.attributeValueId) {
                    attrsBySlug[meta.slug] = {
                        valueId: va.attributeValueId,
                        customValue: va.customValue || undefined
                    };
                } else if (va.customValue) {
                    attrsBySlug[meta.slug] = {
                        customValue: va.customValue
                    };
                }
            });

            return {
                id: v.id,
                name: v.name,
                sku: v.sku,
                price: v.price,
                compareAtPrice: v.compareAtPrice,
                stockQuantity: v.stockQuantity,
                images: v.images || [],
                inStock: v.inStock,
                isActive: v.isActive,
                attributes: attrsBySlug
            };
        });

        setVariants(
            mappedVariants.length
                ? mappedVariants
                : [
                    {
                        id: crypto.randomUUID(),
                        name: '',
                        sku: '',
                        price: 0,
                        compareAtPrice: null,
                        stockQuantity: 0,
                        images: [],
                        inStock: true,
                        isActive: true,
                        attributes: {}
                    }
                ]
        );
    }, [productData, attributes]);

    // parent images
    const handleParentImageUploaded = (url: string) => {
        setImages(prev => [...prev, url]);
    };

    const handleParentImageRemoved = (url: string) => {
        setImages(prev => prev.filter(img => img !== url));
    };

    // variant images
    const handleVariantImageUploaded = (variantId: string, url: string) => {
        setVariants(prev =>
            prev.map(v =>
                v.id === variantId ? { ...v, images: [...v.images, url] } : v
            )
        );
    };

    const handleVariantImageRemoved = (variantId: string, url: string) => {
        setVariants(prev =>
            prev.map(v =>
                v.id === variantId
                    ? { ...v, images: v.images.filter(img => img !== url) }
                    : v
            )
        );
    };

    const addVariant = () => {
        setVariants(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: '',
                sku: '',
                price: 0,
                compareAtPrice: null,
                stockQuantity: 0,
                images: [],
                inStock: true,
                isActive: true,
                attributes: {}
            }
        ]);
    };

    const removeVariant = (id: string) => {
        setVariants(prev => (prev.length > 1 ? prev.filter(v => v.id !== id) : prev));
    };

    const updateVariant = (id: string, field: keyof Variant, value: any) => {
        setVariants(prev =>
            prev.map(v => (v.id === id ? { ...v, [field]: value } : v))
        );
    };

    const updateVariantAttribute = (
        variantId: string,
        attributeSlug: string,
        valueId?: string,
        customValue?: string
    ) => {
        setVariants(prev =>
            prev.map(v => {
                if (v.id !== variantId) return v;
                return {
                    ...v,
                    attributes: {
                        ...v.attributes,
                        [attributeSlug]: { valueId, customValue }
                    }
                };
            })
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            setSaving(true);
            setError(null);

            const tagsArray = tags
                ? tags
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean)
                : [];

            // 1) обновляем parent product
            await apiPut(`/api/admin/products/${params.id}`, {
                name: productName,
                slug,
                description,
                category,
                brand,
                images,
                tags: tagsArray
            });

            // 2) готовим данные по вариантам + их атрибутам
            const variantsData = variants.map(v => {
                const variantAttributes: VariantAttribute[] = [];

                Object.entries(v.attributes).forEach(([slug, attrData]) => {
                    const attribute = attributes.find(a => a.slug === slug);
                    if (!attribute) return;
                    if (attrData.valueId || attrData.customValue) {
                        variantAttributes.push({
                            attributeId: attribute.id,
                            attributeValueId: attrData.valueId,
                            customValue: attrData.customValue
                        });
                    }
                });

                return {
                    id: v.id,
                    sku: v.sku,
                    name: v.name,
                    price: v.price,
                    compare_at_price: v.compareAtPrice ?? null,
                    stock_quantity: v.stockQuantity,
                    in_stock: v.inStock,
                    is_active: v.isActive,
                    images: v.images.length > 0 ? v.images : images,
                    attributes: variantAttributes
                };
            });

            await apiPut(`/api/admin/products/${params.id}/variants`, {
                variants: variantsData
            });

            router.push('/admin/products');
            router.refresh();
        } catch (err: any) {
            console.error('Error updating product with variants:', err);
            setError(err.message || 'Fehler beim Aktualisieren des Produkts');
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadingAttributes) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                    <p className="text-gray-600">Produktdaten werden geladen...</p>
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
                    Produkt mit Varianten bearbeiten
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
                                    onChange={e => setProductName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
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
                                    onChange={e => setSlug(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Beschreibung
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
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
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">-- Kategorie wählen --</option>
                                        {categories.map(cat => (
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
                                        onChange={e => setBrand(e.target.value)}
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
                                    onChange={e => setTags(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Produktbilder *
                                </label>
                                <p className="text-sm text-gray-600 mb-4">
                                    Das erste Bild wird als Hauptbild verwendet. Varianten können
                                    eigene Bilder haben.
                                </p>
                                <ImageUpload
                                    onImageUploaded={handleParentImageUploaded}
                                    onImageRemoved={handleParentImageRemoved}
                                    existingImages={images}
                                    maxImages={5}
                                />
                                {images.length === 0 && (
                                    <p className="mt-3 text-sm text-amber-600">
                                        Bitte laden Sie mindestens ein Bild hoch
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
                                                    onChange={e =>
                                                        updateVariant(variant.id, 'name', e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    SKU *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={e =>
                                                        updateVariant(variant.id, 'sku', e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Preis * (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={variant.price}
                                                    onChange={e =>
                                                        updateVariant(
                                                            variant.id,
                                                            'price',
                                                            parseFloat(e.target.value || '0')
                                                        )
                                                    }
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
                                                    value={variant.compareAtPrice ?? ''}
                                                    onChange={e =>
                                                        updateVariant(
                                                            variant.id,
                                                            'compareAtPrice',
                                                            e.target.value
                                                                ? parseFloat(e.target.value)
                                                                : null
                                                        )
                                                    }
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
                                                    onChange={e =>
                                                        updateVariant(
                                                            variant.id,
                                                            'stockQuantity',
                                                            parseInt(e.target.value || '0', 10)
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    min="0"
                                                />
                                            </div>

                                            <div className="flex items-center gap-4 mt-6">
                                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={variant.inStock}
                                                        onChange={e =>
                                                            updateVariant(
                                                                variant.id,
                                                                'inStock',
                                                                e.target.checked
                                                            )
                                                        }
                                                    />
                                                    Verfügbar
                                                </label>
                                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={variant.isActive}
                                                        onChange={e =>
                                                            updateVariant(
                                                                variant.id,
                                                                'isActive',
                                                                e.target.checked
                                                            )
                                                        }
                                                    />
                                                    Aktiv im Shop
                                                </label>
                                            </div>
                                        </div>

                                        {/* Variant Attributes */}
                                        {attributes.length > 0 && (
                                            <div className="border-t border-gray-200 pt-4 mt-4">
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">
                                                    Varianten-Attribute
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {attributes.map(attribute => (
                                                        <div key={attribute.id}>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {attribute.name}
                                                            </label>
                                                            {attribute.values &&
                                                                attribute.values.length > 0 ? (
                                                                <select
                                                                    value={
                                                                        variant.attributes[
                                                                            attribute.slug
                                                                        ]?.valueId || ''
                                                                    }
                                                                    onChange={e => {
                                                                        if (e.target.value === 'custom') {
                                                                            updateVariantAttribute(
                                                                                variant.id,
                                                                                attribute.slug,
                                                                                undefined,
                                                                                ''
                                                                            );
                                                                        } else if (e.target.value) {
                                                                            updateVariantAttribute(
                                                                                variant.id,
                                                                                attribute.slug,
                                                                                e.target.value,
                                                                                undefined
                                                                            );
                                                                        } else {
                                                                            updateVariantAttribute(
                                                                                variant.id,
                                                                                attribute.slug,
                                                                                undefined,
                                                                                undefined
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                                                >
                                                                    <option value="">
                                                                        Auswählen...
                                                                    </option>
                                                                    {attribute.values.map(value => (
                                                                        <option
                                                                            key={value.id}
                                                                            value={value.id}
                                                                        >
                                                                            {value.value}
                                                                        </option>
                                                                    ))}
                                                                    <option value="custom">
                                                                        Eigenen Wert eingeben...
                                                                    </option>
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        variant.attributes[
                                                                            attribute.slug
                                                                        ]?.customValue || ''
                                                                    }
                                                                    onChange={e =>
                                                                        updateVariantAttribute(
                                                                            variant.id,
                                                                            attribute.slug,
                                                                            undefined,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                                    placeholder={`${attribute.name} eingeben`}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="border-t border-gray-200 pt-4 mt-4">
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                Varianten-spezifische Bilder (optional)
                                            </h4>
                                            <p className="text-xs text-gray-500 mb-3">
                                                Falls nicht hochgeladen, werden die
                                                Hauptprodukt-Bilder verwendet
                                            </p>
                                            <ImageUpload
                                                onImageUploaded={url =>
                                                    handleVariantImageUploaded(variant.id, url)
                                                }
                                                onImageRemoved={url =>
                                                    handleVariantImageRemoved(variant.id, url)
                                                }
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
                            disabled={saving || images.length === 0}
                            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Speichern...' : 'Änderungen speichern'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
