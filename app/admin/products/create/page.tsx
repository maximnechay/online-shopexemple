'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Tag, Euro, FileText, PackagePlus, ArrowLeft, Loader2,
    Plus, Trash2, Save, Layers, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCategories } from '@/lib/hooks/useCategories';
import ImageUpload from '@/components/admin/ImageUpload';
import { apiPost } from '@/lib/api/client';

interface Attribute {
    id: string;
    name: string;
    slug: string;
    type: 'select' | 'multiselect' | 'boolean' | 'text';
    values?: AttributeValue[];
}

interface AttributeValue {
    id: string;
    value: string;
    imageUrl?: string;
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

interface VariantAttribute {
    attributeId: string;
    attributeValueId?: string;
    customValue?: string;
}

export default function CreateProduct() {
    const router = useRouter();
    const { categories } = useCategories();

    const [loading, setLoading] = useState(false);
    const [loadingAttributes, setLoadingAttributes] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Переключатель типа продукта
    const [hasVariants, setHasVariants] = useState(false);

    // Основные данные
    const [form, setForm] = useState({
        name: '',
        slug: '',
        price: '',
        compareAtPrice: '',
        category: '',
        description: '',
        stockQuantity: '',
        brand: '',
        tags: '',
        inStock: true,
    });
    const [images, setImages] = useState<string[]>([]);

    // Атрибуты
    const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string | string[]>>({});

    // Варианты
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
    const [collapsedVariants, setCollapsedVariants] = useState<Set<string>>(new Set());

    // ========== ЗАГРУЗКА ==========

    useEffect(() => {
        loadAttributes();
    }, []);

    const loadAttributes = async () => {
        try {
            const res = await fetch('/api/admin/attributes');
            const data = await res.json();
            setAllAttributes(data || []);
        } catch (err) {
            console.error('Error loading attributes:', err);
        } finally {
            setLoadingAttributes(false);
        }
    };

    // ========== HANDLERS ==========

    const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const changeCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: checked }));
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setForm(prev => ({
            ...prev,
            name,
            slug: prev.slug || generateSlug(name)
        }));
    };

    // Изображения
    const handleImageUploaded = (url: string) => setImages(prev => [...prev, url]);
    const handleImageRemoved = (url: string) => setImages(prev => prev.filter(img => img !== url));
    const handleImagesReordered = (urls: string[]) => setImages(urls);

    // Атрибуты простого продукта
    const handleAttributeChange = (attributeId: string, value: string | string[]) => {
        setSelectedAttributes(prev => ({ ...prev, [attributeId]: value }));
    };

    // Варианты
    const handleVariantImageUploaded = (variantId: string, url: string) => {
        setVariants(prev => prev.map(v =>
            v.id === variantId ? { ...v, images: [...v.images, url] } : v
        ));
    };

    const handleVariantImageRemoved = (variantId: string, url: string) => {
        setVariants(prev => prev.map(v =>
            v.id === variantId ? { ...v, images: v.images.filter(img => img !== url) } : v
        ));
    };

    const handleVariantImagesReordered = (variantId: string, urls: string[]) => {
        setVariants(prev => prev.map(v =>
            v.id === variantId ? { ...v, images: urls } : v
        ));
    };

    const addVariant = () => {
        setVariants(prev => [...prev, {
            id: crypto.randomUUID(),
            name: '',
            sku: '',
            price: 0,
            compareAtPrice: 0,
            stockQuantity: 0,
            images: [],
            attributes: {}
        }]);
    };

    const removeVariant = (id: string) => {
        setVariants(prev => prev.length > 1 ? prev.filter(v => v.id !== id) : prev);
    };

    const updateVariant = (id: string, field: keyof Variant, value: any) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const updateVariantAttribute = (
        variantId: string,
        attributeSlug: string,
        valueId?: string,
        customValue?: string
    ) => {
        setVariants(prev => prev.map(v => {
            if (v.id !== variantId) return v;
            return {
                ...v,
                attributes: {
                    ...v.attributes,
                    [attributeSlug]: { valueId, customValue }
                }
            };
        }));
    };

    const toggleVariantCollapse = (id: string) => {
        setCollapsedVariants(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const collapseAllVariants = () => setCollapsedVariants(new Set(variants.map(v => v.id)));
    const expandAllVariants = () => setCollapsedVariants(new Set());

    const generateSKU = (variant: Variant) => {
        const brandPrefix = (form.brand || 'PRD').slice(0, 3).toUpperCase();
        const attrParts: string[] = [];

        Object.entries(variant.attributes).forEach(([slug, attrData]) => {
            const attribute = allAttributes.find(a => a.slug === slug);
            if (!attribute) return;

            let value = '';
            if (attrData.valueId) {
                const attrValue = attribute.values?.find(v => v.id === attrData.valueId);
                value = attrValue?.value || '';
            } else if (attrData.customValue) {
                value = attrData.customValue;
            }

            if (value) {
                const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
                if (cleanValue) attrParts.push(cleanValue);
            }
        });

        if (attrParts.length === 0) {
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            return `${brandPrefix}-${randomCode}`;
        }

        return `${brandPrefix}-${attrParts.join('-')}`;
    };

    // ========== SUBMIT ==========

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (images.length === 0) {
            setError('Bitte laden Sie mindestens ein Bild hoch');
            return;
        }

        if (hasVariants) {
            if (!form.name || !form.slug || !form.category || variants.length === 0) {
                setError('Bitte füllen Sie alle Pflichtfelder aus');
                return;
            }
            for (const variant of variants) {
                if (!variant.name || !variant.sku || variant.price <= 0) {
                    setError('Alle Varianten müssen Name, SKU und Preis haben');
                    return;
                }
            }
        } else {
            if (!form.name || !form.price || !form.category) {
                setError('Bitte füllen Sie alle Pflichtfelder aus');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const tagsArray = form.tags
                ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            if (hasVariants) {
                // Создаём продукт с вариантами
                const variantsData = variants.map(v => {
                    const variantAttributes: VariantAttribute[] = [];
                    Object.entries(v.attributes).forEach(([slug, attrData]) => {
                        const attribute = allAttributes.find(a => a.slug === slug);
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
                        images: v.images,
                        attributes: variantAttributes
                    };
                });

                await apiPost('/api/admin/products/create-with-variants', {
                    name: form.name,
                    slug: form.slug,
                    description: form.description,
                    category: form.category,
                    brand: form.brand,
                    images,
                    tags: tagsArray,
                    variants: variantsData
                });
            } else {
                // Создаём простой продукт
                const data = await apiPost('/api/admin/products', {
                    name: form.name,
                    price: Number(form.price),
                    compare_at_price: form.compareAtPrice ? Number(form.compareAtPrice) : null,
                    category: form.category,
                    description: form.description,
                    brand: form.brand || null,
                    stock_quantity: form.stockQuantity ? Number(form.stockQuantity) : 0,
                    in_stock: form.inStock,
                    images,
                    tags: tagsArray.length > 0 ? tagsArray : null,
                });

                // Сохраняем атрибуты
                const productId = data.id;
                if (Object.keys(selectedAttributes).length > 0) {
                    const attributePromises = Object.entries(selectedAttributes)
                        .filter(([_, value]) => {
                            if (Array.isArray(value)) return value.length > 0;
                            return value && value !== '';
                        })
                        .map(([attributeId, value]) => {
                            if (Array.isArray(value)) {
                                return Promise.all(
                                    value.map(valueId =>
                                        apiPost('/api/admin/products/attributes', {
                                            productId,
                                            attributeId,
                                            attributeValueId: valueId,
                                        })
                                    )
                                );
                            }
                            return apiPost('/api/admin/products/attributes', {
                                productId,
                                attributeId,
                                attributeValueId: value,
                            });
                        });
                    await Promise.all(attributePromises);
                }
            }

            router.push('/admin/products');
            router.refresh();
        } catch (err: any) {
            console.error('Error creating product:', err);
            setError(err.message || 'Fehler beim Erstellen des Produkts');
        } finally {
            setLoading(false);
        }
    };

    // ========== RENDER ==========

    if (loadingAttributes) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Wird geladen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-5xl mx-auto">
                <Link
                    href="/admin/products"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zur Produktliste
                </Link>

                <h1 className="text-3xl font-light text-gray-900 mb-8">
                    Neues Produkt erstellen
                </h1>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                        {error}
                    </div>
                )}

                {/* Переключатель типа */}
                <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-4">Produkttyp wählen:</p>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setHasVariants(false)}
                            className={`flex-1 p-4 rounded-xl border-2 transition text-left ${!hasVariants
                                ? 'border-black bg-white'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Tag className="w-5 h-5" />
                                <span className="font-medium">Einfaches Produkt</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Ein Produkt ohne Varianten (Größe, Farbe, etc.)
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setHasVariants(true)}
                            className={`flex-1 p-4 rounded-xl border-2 transition text-left ${hasVariants
                                ? 'border-black bg-white'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Layers className="w-5 h-5" />
                                <span className="font-medium">Produkt mit Varianten</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Mehrere Varianten (z.B. verschiedene Längen, Farben)
                            </p>
                        </button>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-8">
                    {/* ========== ОСНОВНАЯ ИНФОРМАЦИЯ ========== */}
                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                        <h2 className="text-xl font-medium text-gray-900 mb-6">Produkt-Informationen</h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Produktname *</label>
                                    <div className="flex items-center gap-3">
                                        <Tag className="w-5 h-5 text-gray-500" />
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleNameChange}
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                            placeholder="z.B. BELLAMI Flex Weft"
                                        />
                                    </div>
                                </div>

                                {hasVariants && (
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Slug *</label>
                                        <input
                                            name="slug"
                                            value={form.slug}
                                            onChange={change}
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                            placeholder="bellami-flex-weft"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Marke</label>
                                    <input
                                        name="brand"
                                        value={form.brand}
                                        onChange={change}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                        placeholder="z.B. BELLAMI"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Kategorie *</label>
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black bg-white"
                                    >
                                        <option value="">-- Kategorie wählen --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Цена и склад только для простого продукта */}
                                {!hasVariants && (
                                    <>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">Preis (€) *</label>
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
                                                Alter Preis (€) <span className="text-gray-400 text-xs">(optional)</span>
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

                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">Lagerbestand</label>
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
                                                <span className="text-gray-700">Produkt ist verfügbar</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Beschreibung</label>
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-gray-500 mt-3" />
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

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Tags (kommagetrennt)</label>
                                <input
                                    name="tags"
                                    value={form.tags}
                                    onChange={change}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                    placeholder="flexweft, hair-extensions"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-3">Produktbilder *</label>
                                <p className="text-sm text-gray-600 mb-4">
                                    Das erste Bild wird als Hauptbild verwendet.
                                    {hasVariants && ' Varianten können eigene Bilder haben.'}
                                </p>
                                <ImageUpload
                                    onImageUploaded={handleImageUploaded}
                                    onImageRemoved={handleImageRemoved}
                                    onImagesReordered={handleImagesReordered}
                                    existingImages={images}
                                    maxImages={5}
                                />
                                {images.length === 0 && (
                                    <p className="mt-3 text-sm text-amber-600">⚠️ Bitte laden Sie mindestens ein Bild hoch</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ========== АТРИБУТЫ (простой продукт) ========== */}
                    {!hasVariants && allAttributes.length > 0 && (
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                            <h2 className="text-xl font-medium text-gray-900 mb-6">Produktattribute</h2>
                            <div className="space-y-4">
                                {allAttributes.map(attr => (
                                    <div key={attr.id}>
                                        <label className="block text-gray-700 font-medium mb-2">{attr.name}</label>
                                        {attr.type === 'select' && (
                                            <select
                                                value={(selectedAttributes[attr.id] as string) || ''}
                                                onChange={e => handleAttributeChange(attr.id, e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black bg-white"
                                            >
                                                <option value="">-- {attr.name} wählen --</option>
                                                {attr.values?.map(val => (
                                                    <option key={val.id} value={val.id}>{val.value}</option>
                                                ))}
                                            </select>
                                        )}
                                        {attr.type === 'multiselect' && (
                                            <div className="space-y-2">
                                                {attr.values?.map(val => (
                                                    <label key={val.id} className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={(selectedAttributes[attr.id] as string[] || []).includes(val.id)}
                                                            onChange={e => {
                                                                const current = (selectedAttributes[attr.id] as string[]) || [];
                                                                const newValue = e.target.checked
                                                                    ? [...current, val.id]
                                                                    : current.filter(id => id !== val.id);
                                                                handleAttributeChange(attr.id, newValue);
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
                                                    onChange={e => handleAttributeChange(attr.id, e.target.checked ? 'true' : 'false')}
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

                    {/* ========== ВАРИАНТЫ ========== */}
                    {hasVariants && (
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                                <h2 className="text-xl font-medium text-gray-900">Varianten ({variants.length})</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={collapseAllVariants}
                                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Alle einklappen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={expandAllVariants}
                                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Alle ausklappen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addVariant}
                                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition inline-flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Variante
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {variants.map((variant, index) => {
                                    const isCollapsed = collapsedVariants.has(variant.id);

                                    return (
                                        <div key={variant.id} className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
                                            {/* Header */}
                                            <div
                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                                                onClick={() => toggleVariantCollapse(variant.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {isCollapsed ? (
                                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                                    ) : (
                                                        <ChevronUp className="w-5 h-5 text-gray-500" />
                                                    )}
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">
                                                            {variant.name || `Variante ${index + 1}`}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            SKU: {variant.sku || '—'} • {variant.price.toFixed(2)} € • Bestand: {variant.stockQuantity}
                                                        </p>
                                                    </div>
                                                </div>
                                                {variants.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeVariant(variant.id);
                                                        }}
                                                        className="text-red-600 hover:text-red-700 p-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Content */}
                                            {!isCollapsed && (
                                                <div className="p-6 pt-2 border-t border-gray-200">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                                            <input
                                                                type="text"
                                                                value={variant.name}
                                                                onChange={e => updateVariant(variant.id, 'name', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                                placeholder='16" 120g Golden Blonde'
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={variant.sku}
                                                                    onChange={e => updateVariant(variant.id, 'sku', e.target.value)}
                                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                                    required
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateVariant(variant.id, 'sku', generateSKU(variant))}
                                                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                                                                >
                                                                    Auto
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Preis * (€)</label>
                                                            <input
                                                                type="number"
                                                                value={variant.price}
                                                                onChange={e => updateVariant(variant.id, 'price', parseFloat(e.target.value || '0'))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                                min="0"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Vergleichspreis (€)</label>
                                                            <input
                                                                type="number"
                                                                value={variant.compareAtPrice || ''}
                                                                onChange={e => updateVariant(variant.id, 'compareAtPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Lagerbestand</label>
                                                            <input
                                                                type="number"
                                                                value={variant.stockQuantity}
                                                                onChange={e => updateVariant(variant.id, 'stockQuantity', parseInt(e.target.value || '0', 10))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Атрибуты варианта */}
                                                    {allAttributes.length > 0 && (
                                                        <div className="border-t border-gray-200 pt-4 mt-4">
                                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Attribute</h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                {allAttributes.map(attribute => (
                                                                    <div key={attribute.id}>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{attribute.name}</label>
                                                                        {attribute.values && attribute.values.length > 0 ? (
                                                                            <select
                                                                                value={variant.attributes[attribute.slug]?.valueId || ''}
                                                                                onChange={e => {
                                                                                    if (e.target.value === 'custom') {
                                                                                        updateVariantAttribute(variant.id, attribute.slug, undefined, '');
                                                                                    } else if (e.target.value) {
                                                                                        updateVariantAttribute(variant.id, attribute.slug, e.target.value, undefined);
                                                                                    } else {
                                                                                        updateVariantAttribute(variant.id, attribute.slug, undefined, undefined);
                                                                                    }
                                                                                }}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                                                            >
                                                                                <option value="">Auswählen...</option>
                                                                                {attribute.values.map(value => (
                                                                                    <option key={value.id} value={value.id}>{value.value}</option>
                                                                                ))}
                                                                                <option value="custom">Eigenen Wert...</option>
                                                                            </select>
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                value={variant.attributes[attribute.slug]?.customValue || ''}
                                                                                onChange={e => updateVariantAttribute(variant.id, attribute.slug, undefined, e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Изображения варианта */}
                                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Bilder (optional)</h4>
                                                        <p className="text-xs text-gray-500 mb-3">
                                                            Falls nicht hochgeladen, werden die Hauptprodukt-Bilder verwendet
                                                        </p>
                                                        <ImageUpload
                                                            onImageUploaded={url => handleVariantImageUploaded(variant.id, url)}
                                                            onImageRemoved={url => handleVariantImageRemoved(variant.id, url)}
                                                            onImagesReordered={urls => handleVariantImagesReordered(variant.id, urls)}
                                                            existingImages={variant.images}
                                                            maxImages={3}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========== SUBMIT ========== */}
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