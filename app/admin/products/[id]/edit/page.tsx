'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Tag, Euro, FileText, PackagePlus, ArrowLeft, Loader2,
    Package, Settings, Plus, Trash2, Save, Layers, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCategories } from '@/lib/hooks/useCategories';
import ImageUpload from '@/components/admin/ImageUpload';
import { apiPut, apiPost } from '@/lib/api/client';

interface EditProductProps {
    params: Promise<{ id: string }>;
}

type Tab = 'details' | 'variants' | 'attributes' | 'stock';

interface Attribute {
    id: string;
    name: string;
    slug: string;
    type: 'select' | 'text';
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
    compareAtPrice?: number | null;
    stockQuantity: number;
    images: string[];
    inStock: boolean;
    isActive: boolean;
    attributes: Record<string, { valueId?: string; customValue?: string }>;
}

interface VariantAttribute {
    attributeId: string;
    attributeValueId?: string;
    customValue?: string;
}

export default function EditProduct({ params }: EditProductProps) {
    const router = useRouter();
    const { categories } = useCategories();

    const [productId, setProductId] = useState('');
    const [productSlug, setProductSlug] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [error, setError] = useState<string | null>(null);

    // Определяем тип продукта
    const [hasVariants, setHasVariants] = useState(false);

    // Основные данные продукта
    const [form, setForm] = useState({
        name: '',
        slug: '',
        price: '',
        compareAtPrice: '',
        category: '',
        description: '',
        brand: '',
        tags: '',
        inStock: true,
    });
    const [images, setImages] = useState<string[]>([]);
    const [currentStock, setCurrentStock] = useState(0);

    // Атрибуты (для простых продуктов)
    const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);
    const [attributeValues, setAttributeValues] = useState<Record<string, AttributeValue[]>>({});
    const [attributesForm, setAttributesForm] = useState<Record<string, string>>({});

    // Варианты (для продуктов с вариантами)
    const [variants, setVariants] = useState<Variant[]>([]);
    const [collapsedVariants, setCollapsedVariants] = useState<Set<string>>(new Set());

    // Сырые данные продукта для маппинга после загрузки атрибутов
    const [rawProductData, setRawProductData] = useState<any>(null);

    // Управление складом
    const [stockAdjustment, setStockAdjustment] = useState({
        quantityChange: '',
        reason: '',
    });

    // ========== ЗАГРУЗКА ДАННЫХ ==========

    useEffect(() => {
        loadAttributes();
    }, []);

    useEffect(() => {
        loadProduct();
    }, [params]);

    const loadAttributes = async () => {
        try {
            const res = await fetch('/api/admin/attributes');
            if (!res.ok) throw new Error('Failed to load attributes');
            const data = await res.json();
            setAllAttributes(data);

            const valuesMap: Record<string, AttributeValue[]> = {};
            for (const attr of data) {
                if (attr.values?.length > 0) {
                    valuesMap[attr.id] = attr.values.map((val: any) => ({
                        id: val.id,
                        value: val.value,
                        imageUrl: val.imageUrl || null
                    }));
                }
            }
            setAttributeValues(valuesMap);
        } catch (error) {
            console.error('Error loading attributes:', error);
        }
    };

    const loadProduct = async () => {
        try {
            const resolvedParams = await params;
            setProductId(resolvedParams.id);

            const res = await fetch(`/api/admin/products/${resolvedParams.id}`);
            if (!res.ok) throw new Error('Failed to load product');
            const product = await res.json();

            setProductSlug(product.slug || '');
            setForm({
                name: product.name || '',
                slug: product.slug || '',
                price: product.price?.toString() || '',
                compareAtPrice: product.compare_at_price?.toString() || '',
                category: product.category || '',
                description: product.description || '',
                brand: product.brand || '',
                tags: product.tags?.join(', ') || '',
                inStock: product.in_stock ?? true,
            });
            setCurrentStock(product.stock_quantity || 0);
            setImages(product.images || []);

            // Определяем тип продукта
            const productHasVariants = product.variants && product.variants.length > 0;
            setHasVariants(productHasVariants);

            // Сохраняем сырые данные для маппинга после загрузки атрибутов
            setRawProductData(product);

            // Для простого продукта загружаем атрибуты сразу
            if (!productHasVariants) {
                const attrsRes = await fetch(`/api/products/${product.slug}/attributes`);
                if (attrsRes.ok) {
                    const attrs = await attrsRes.json();
                    const formData: Record<string, string> = {};
                    attrs.forEach((attr: any) => {
                        if (attr.attributeValueId) {
                            formData[attr.attributeId] = attr.attributeValueId;
                        } else if (attr.customValue) {
                            formData[attr.attributeId] = attr.customValue;
                        }
                    });
                    setAttributesForm(formData);
                }
            }
        } catch (error) {
            console.error('Error loading product:', error);
            setError('Fehler beim Laden des Produkts');
        } finally {
            setLoading(false);
        }
    };

    // Маппинг вариантов когда загружены И продукт И атрибуты
    useEffect(() => {
        if (!rawProductData || !allAttributes.length) return;
        if (!rawProductData.variants?.length) return;

        const mappedVariants: Variant[] = rawProductData.variants.map((v: any) => {
            const rawAttrs = rawProductData.variantAttributes?.[v.id] || [];
            const attrsBySlug: Record<string, { valueId?: string; customValue?: string }> = {};

            rawAttrs.forEach((va: any) => {
                const meta = allAttributes.find(a => a.id === va.attributeId);
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

        setVariants(mappedVariants);
    }, [rawProductData, allAttributes]);

    // ========== HANDLERS ==========

    const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const changeCheckbox = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: checked }));

        if (name === 'inStock') {
            try {
                await apiPut(`/api/admin/products/${productId}`, { in_stock: checked });
            } catch (error) {
                setForm(prev => ({ ...prev, [name]: !checked }));
                alert('Fehler beim Speichern');
            }
        }
    };

    // Изображения родительского продукта
    const handleImageUploaded = (url: string) => setImages(prev => [...prev, url]);
    const handleImageRemoved = (url: string) => setImages(prev => prev.filter(img => img !== url));
    const handleImagesReordered = (urls: string[]) => setImages(urls);

    // Атрибуты простого продукта
    const handleAttributeChange = (attributeId: string, value: string) => {
        setAttributesForm(prev => ({ ...prev, [attributeId]: value }));
    };

    const saveAttributes = async () => {
        try {
            const attributes = Object.entries(attributesForm)
                .filter(([_, value]) => value)
                .map(([attributeId, value]) => {
                    const attribute = allAttributes.find(a => a.id === attributeId);
                    if (attribute?.type === 'select') {
                        return { attributeId, attributeValueId: value, customValue: null };
                    }
                    return { attributeId, attributeValueId: null, customValue: value };
                });

            await apiPost(`/api/admin/products/${productId}/attributes`, { attributes });
            alert('✅ Attribute erfolgreich gespeichert!');
        } catch (error) {
            alert('Fehler beim Speichern der Attribute');
        }
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
            compareAtPrice: null,
            stockQuantity: 0,
            images: [],
            inStock: true,
            isActive: true,
            attributes: {}
        }]);
    };

    const removeVariant = (id: string) => {
        setVariants(prev => prev.length > 1 ? prev.filter(v => v.id !== id) : prev);
    };

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

    const toggleVariantCollapse = (id: string) => {
        setCollapsedVariants(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const collapseAllVariants = () => {
        setCollapsedVariants(new Set(variants.map(v => v.id)));
    };

    const expandAllVariants = () => {
        setCollapsedVariants(new Set());
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

    // ========== SUBMIT ==========

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) {
            setError('Bitte laden Sie mindestens ein Bild hoch');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const tagsArray = form.tags
                ? form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                : [];

            if (hasVariants) {
                // Сохраняем продукт с вариантами
                for (const variant of variants) {
                    if (!variant.name || !variant.sku || variant.price <= 0) {
                        setError('Alle Varianten müssen Name, SKU und Preis haben');
                        setSaving(false);
                        return;
                    }
                }

                await apiPut(`/api/admin/products/${productId}`, {
                    name: form.name,
                    slug: form.slug,
                    description: form.description,
                    category: form.category,
                    brand: form.brand,
                    images,
                    tags: tagsArray
                });

                const variantsData = variants.map(v => {
                    const variantAttributes: VariantAttribute[] = [];
                    Object.entries(v.attributes).forEach(([slug, attrData]) => {
                        const attribute = allAttributes.find(a => a.slug === slug);
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

                await apiPut(`/api/admin/products/${productId}/variants`, { variants: variantsData });
            } else {
                // Сохраняем простой продукт
                await apiPut(`/api/admin/products/${productId}`, {
                    name: form.name,
                    price: Number(form.price),
                    compare_at_price: form.compareAtPrice ? Number(form.compareAtPrice) : null,
                    category: form.category,
                    description: form.description,
                    brand: form.brand || null,
                    in_stock: form.inStock,
                    images,
                    tags: tagsArray,
                });
            }

            router.push('/admin/products');
            router.refresh();
        } catch (error: any) {
            setError(error.message || 'Fehler beim Aktualisieren des Produkts');
        } finally {
            setSaving(false);
        }
    };

    // ========== RENDER ==========

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Produkt wird geladen...</p>
                </div>
            </div>
        );
    }

    const tabs = hasVariants
        ? [
            { id: 'details' as Tab, label: 'Produktdetails', icon: Tag },
            { id: 'variants' as Tab, label: 'Varianten', icon: Layers },
        ]
        : [
            { id: 'details' as Tab, label: 'Produktdetails', icon: Tag },
            { id: 'attributes' as Tab, label: 'Attribute', icon: Settings },
            { id: 'stock' as Tab, label: 'Lagerbestand', icon: Package },
        ];

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

                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-3xl font-light text-gray-900">
                        Produkt bearbeiten
                    </h1>
                    {hasVariants && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                            Mit Varianten
                        </span>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={submit} className="space-y-8">
                    {/* ========== TAB: DETAILS ========== */}
                    {activeTab === 'details' && (
                        <div className="space-y-8 bg-gray-50 p-8 rounded-3xl border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Produktname *</label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={change}
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                    />
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
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Beschreibung</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={change}
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Tags (kommagetrennt)</label>
                                <input
                                    name="tags"
                                    value={form.tags}
                                    onChange={change}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-3">Produktbilder *</label>
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

                            <button
                                type="submit"
                                disabled={saving || images.length === 0}
                                className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Speichern...' : 'Änderungen speichern'}
                            </button>
                        </div>
                    )}

                    {/* ========== TAB: VARIANTS ========== */}
                    {activeTab === 'variants' && hasVariants && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <h2 className="text-xl font-medium text-gray-900">Varianten ({variants.length})</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={collapseAllVariants}
                                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Alle einklappen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={expandAllVariants}
                                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Alle ausklappen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addVariant}
                                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition inline-flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Variante hinzufügen
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {variants.map((variant, index) => {
                                    const isCollapsed = collapsedVariants.has(variant.id);

                                    return (
                                        <div key={variant.id} className="bg-gray-50 border-2 border-gray-200 rounded-2xl overflow-hidden">
                                            {/* Header - всегда видим */}
                                            <div
                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition"
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
                                                            {!variant.isActive && <span className="ml-2 text-amber-600">• Inaktiv</span>}
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

                                            {/* Content - сворачиваемый */}
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
                                                                    title="SKU automatisch generieren"
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
                                                                value={variant.compareAtPrice ?? ''}
                                                                onChange={e => updateVariant(variant.id, 'compareAtPrice', e.target.value ? parseFloat(e.target.value) : null)}
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
                                                        <div className="flex items-center gap-4 pt-6">
                                                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                                <input type="checkbox" checked={variant.inStock} onChange={e => updateVariant(variant.id, 'inStock', e.target.checked)} />
                                                                Verfügbar
                                                            </label>
                                                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                                <input type="checkbox" checked={variant.isActive} onChange={e => updateVariant(variant.id, 'isActive', e.target.checked)} />
                                                                Aktiv
                                                            </label>
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
                                                        <ImageUpload
                                                            onImageUploaded={url => handleVariantImageUploaded(variant.id, url)}
                                                            onImageRemoved={url => handleVariantImageRemoved(variant.id, url)}
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

                            <button
                                type="submit"
                                disabled={saving || images.length === 0}
                                className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Speichern...' : 'Alle Änderungen speichern'}
                            </button>
                        </div>
                    )}

                    {/* ========== TAB: ATTRIBUTES (простой продукт) ========== */}
                    {activeTab === 'attributes' && !hasVariants && (
                        <div className="space-y-6 bg-gray-50 p-8 rounded-3xl border border-gray-200">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-900">ℹ️ Attribute für dieses Produkt hinzufügen</p>
                            </div>

                            {allAttributes.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 mb-4">Keine Attribute verfügbar</p>
                                    <Link href="/admin/attributes" className="text-blue-600 hover:underline">Attribute verwalten →</Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {allAttributes.map(attribute => (
                                        <div key={attribute.id} className="bg-white p-6 rounded-2xl border border-gray-200">
                                            <label className="block text-gray-900 font-medium mb-3">
                                                {attribute.name}
                                                <span className="text-xs text-gray-500 ml-2">({attribute.slug})</span>
                                            </label>
                                            {attribute.type === 'select' && attributeValues[attribute.id] ? (
                                                <select
                                                    value={attributesForm[attribute.id] || ''}
                                                    onChange={e => handleAttributeChange(attribute.id, e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black bg-white"
                                                >
                                                    <option value="">-- Wählen --</option>
                                                    {attributeValues[attribute.id].map(value => (
                                                        <option key={value.id} value={value.id}>{value.value}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={attributesForm[attribute.id] || ''}
                                                    onChange={e => handleAttributeChange(attribute.id, e.target.value)}
                                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={saveAttributes}
                                        className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition"
                                    >
                                        Attribute speichern
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== TAB: STOCK (простой продукт) ========== */}
                    {activeTab === 'stock' && !hasVariants && (
                        <div className="space-y-6 bg-gray-50 p-8 rounded-3xl border border-gray-200">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Aktueller Lagerbestand</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {currentStock}
                                            <span className="text-lg font-normal text-gray-500 ml-2">Einheiten</span>
                                        </p>
                                    </div>
                                    <PackagePlus className="w-12 h-12 text-gray-400" />
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <label className="inline-flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="inStock"
                                            checked={form.inStock}
                                            onChange={changeCheckbox}
                                            className="w-5 h-5 rounded border-gray-300"
                                        />
                                        <div>
                                            <span className="text-gray-900 font-medium">Produkt ist verfügbar</span>
                                            <p className="text-xs text-gray-500">Wird automatisch gespeichert</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Bestand anpassen</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Änderungsmenge *</label>
                                        <input
                                            type="number"
                                            value={stockAdjustment.quantityChange}
                                            onChange={e => setStockAdjustment(prev => ({ ...prev, quantityChange: e.target.value }))}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                            placeholder="+50 oder -3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Grund *</label>
                                        <textarea
                                            value={stockAdjustment.reason}
                                            onChange={e => setStockAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                                            rows={3}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black resize-none"
                                            placeholder="z.B. Lieferung, Retoure..."
                                        />
                                    </div>

                                    {stockAdjustment.quantityChange && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <p className="text-sm text-blue-900">
                                                {currentStock} → {currentStock + Number(stockAdjustment.quantityChange)} Einheiten
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!stockAdjustment.quantityChange || !stockAdjustment.reason) {
                                                alert('Bitte füllen Sie alle Felder aus');
                                                return;
                                            }
                                            try {
                                                const data = await apiPost(`/api/admin/products/${productId}/adjust-stock`, {
                                                    quantityChange: Number(stockAdjustment.quantityChange),
                                                    reason: stockAdjustment.reason,
                                                });
                                                setCurrentStock(data.newStock);
                                                setStockAdjustment({ quantityChange: '', reason: '' });
                                                alert(`✅ Neuer Bestand: ${data.newStock}`);
                                            } catch (error) {
                                                alert('Fehler beim Anpassen');
                                            }
                                        }}
                                        disabled={!stockAdjustment.quantityChange || !stockAdjustment.reason}
                                        className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Bestand anpassen
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}