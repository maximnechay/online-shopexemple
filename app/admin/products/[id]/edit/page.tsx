'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Euro, FileText, PackagePlus, ArrowLeft, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { useCategories } from '@/lib/hooks/useCategories';
import ImageUpload from '@/components/admin/ImageUpload';
import { apiPut, apiPost } from '@/lib/api/client';

interface EditProductProps {
    params: Promise<{ id: string }>;
}

type Tab = 'details' | 'stock';

export default function EditProduct({ params }: EditProductProps) {
    const router = useRouter();
    const { categories } = useCategories();
    const [productId, setProductId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [images, setImages] = useState<string[]>([]);
    const [currentStock, setCurrentStock] = useState<number>(0);
    const [stockAdjustment, setStockAdjustment] = useState({
        quantityChange: '',
        reason: '',
    });

    const [form, setForm] = useState({
        name: '',
        price: '',
        compareAtPrice: '',
        category: '',
        description: '',
        brand: '',
        tags: '',
        inStock: true,
    });

    // Загрузка данных продукта
    useEffect(() => {
        async function loadProduct() {
            try {
                const resolvedParams = await params;
                setProductId(resolvedParams.id);

                const res = await fetch(`/api/admin/products/${resolvedParams.id}`);
                if (!res.ok) throw new Error('Failed to load product');

                const product = await res.json();

                setForm({
                    name: product.name || '',
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
            } catch (error) {
                console.error('Error loading product:', error);
                alert('Fehler beim Laden des Produkts');
            } finally {
                setLoading(false);
            }
        }

        loadProduct();
    }, [params]);

    const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? value : value,
        }));
    };

    const changeCheckbox = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: checked,
        }));

        // Автосохранение статуса доступности
        if (name === 'inStock') {
            try {
                await apiPut(`/api/admin/products/${productId}`, { in_stock: checked });
                console.log('✅ Availability status updated automatically');
            } catch (error) {
                console.error('Error updating availability:', error);
                setForm(prev => ({
                    ...prev,
                    [name]: !checked,
                }));
                alert('Fehler beim Speichern');
            }
        }
    };

    const handleImageUploaded = (url: string) => {
        setImages(prev => [...prev, url]);
        console.log('✅ Image uploaded:', url);
    };

    const handleImageRemoved = (url: string) => {
        setImages(prev => prev.filter(img => img !== url));
        console.log('🗑️ Image removed:', url);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (images.length === 0) {
            alert('Bitte laden Sie mindestens ein Bild hoch');
            return;
        }

        // Преобразуем tags из строки в массив
        const tagsArray = form.tags
            ? form.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            : [];

        const payload = {
            name: form.name,
            price: Number(form.price),
            compare_at_price: form.compareAtPrice
                ? Number(form.compareAtPrice)
                : null,
            category: form.category,
            description: form.description,
            brand: form.brand || null,
            in_stock: form.inStock,
            images: images,
            tags: tagsArray,
        };

        try {
            const data = await apiPut(`/api/admin/products/${productId}`, payload);
            console.log('✅ Product updated:', data);
            router.push('/admin/products');
            router.refresh();
        } catch (error: any) {
            console.error('Update product error:', error);
            alert(error.message || 'Fehler beim Aktualisieren des Produkts');
        }
    };

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

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-light text-gray-900 mb-10">
                    Produkt bearbeiten
                </h1>

                <Link
                    href="/admin/products"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zur Produktliste
                </Link>

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'details'
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Tag className="w-4 h-4" />
                        Produktdetails
                    </button>
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'stock'
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Package className="w-4 h-4" />
                        Lagerbestand
                    </button>
                </div>

                {/* Tab: Produktdetails */}
                {activeTab === 'details' && (
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

                        {/* Images */}
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

                        <button
                            type="submit"
                            disabled={images.length === 0}
                            className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Änderungen speichern
                        </button>
                    </form>
                )}

                {/* Tab: Lagerbestand */}
                {activeTab === 'stock' && (
                    <div className="space-y-6 bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-sm">
                        {/* Current Stock Display */}
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

                            {/* Availability Status */}
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
                                        <span className="text-gray-900 font-medium">
                                            Produkt ist verfügbar
                                        </span>
                                        <p className="text-xs text-gray-500">
                                            Wird automatisch gespeichert
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Stock Adjustment Form */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Bestand anpassen
                            </h3>

                            <p className="text-sm text-gray-600 mb-6">
                                Verwenden Sie dieses Formular, um den Lagerbestand zu korrigieren.
                                Alle Änderungen werden vollständig protokolliert.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Änderungsmenge *
                                    </label>
                                    <input
                                        type="number"
                                        value={stockAdjustment.quantityChange}
                                        onChange={(e) => setStockAdjustment(prev => ({
                                            ...prev,
                                            quantityChange: e.target.value
                                        }))}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black"
                                        placeholder="z.B. +50 (hinzufügen) oder -3 (entfernen)"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        ✅ Positive Zahl (+) für Warenzugang<br />
                                        ⚠️ Negative Zahl (-) für Warenabgang
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Grund für die Änderung *
                                    </label>
                                    <textarea
                                        value={stockAdjustment.reason}
                                        onChange={(e) => setStockAdjustment(prev => ({
                                            ...prev,
                                            reason: e.target.value
                                        }))}
                                        rows={3}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black resize-none"
                                        placeholder="z.B. Lieferung vom Lieferanten, Beschädigte Ware bei Inventur, Retoure, etc."
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Dieser Grund wird im Protokoll gespeichert
                                    </p>
                                </div>

                                {/* Preview */}
                                {stockAdjustment.quantityChange && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-sm font-medium text-blue-900 mb-1">
                                            Vorschau der Änderung:
                                        </p>
                                        <p className="text-blue-700">
                                            {currentStock} → {currentStock + Number(stockAdjustment.quantityChange)} Einheiten
                                            <span className={`ml-2 font-semibold ${Number(stockAdjustment.quantityChange) > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                ({Number(stockAdjustment.quantityChange) > 0 ? '+' : ''}{stockAdjustment.quantityChange})
                                            </span>
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

                                        const quantityChange = Number(stockAdjustment.quantityChange);
                                        if (isNaN(quantityChange) || quantityChange === 0) {
                                            alert('Bitte geben Sie eine gültige Menge ein (nicht 0)');
                                            return;
                                        }

                                        try {
                                            const data = await apiPost(`/api/admin/products/${productId}/adjust-stock`, {
                                                quantityChange,
                                                reason: stockAdjustment.reason,
                                            });

                                            console.log('✅ Stock adjusted:', data);
                                            setCurrentStock(data.newStock);
                                            setStockAdjustment({ quantityChange: '', reason: '' });
                                            alert(`✅ Bestand erfolgreich angepasst!\n\nNeuer Bestand: ${data.newStock} Einheiten`);
                                        } catch (error) {
                                            console.error('Error adjusting stock:', error);
                                            alert('Fehler beim Anpassen des Bestands');
                                        }
                                    }}
                                    disabled={!stockAdjustment.quantityChange || !stockAdjustment.reason}
                                    className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Bestand jetzt anpassen
                                </button>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h4 className="font-semibold text-blue-900 mb-2">
                                ℹ️ Wichtige Hinweise
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Alle Änderungen werden in der Datenbank protokolliert</li>
                                <li>• Sie können die Historie später einsehen</li>
                                <li>• Bei negativem Bestand wird eine Warnung angezeigt</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}