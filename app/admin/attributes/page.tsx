// app/admin/attributes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Pencil, Trash2, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Attribute, AttributeValue } from '@/lib/types/attributes';
import { apiPost, apiDelete, apiPatch } from '@/lib/api/client';

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function AttributesManagementPage() {
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set());
    const [expandedValues, setExpandedValues] = useState<Set<string>>(new Set());
    const [expandedAttrCategories, setExpandedAttrCategories] = useState<Set<string>>(new Set());
    const [showNewAttributeForm, setShowNewAttributeForm] = useState(false);
    const [newAttribute, setNewAttribute] = useState({
        name: '',
        type: 'select',
        filterable: true,
        visibleInCatalog: true,
        categories: [] as string[]
    });
    const [newValues, setNewValues] = useState<{ [key: string]: string }>({});
    const [valueCategories, setValueCategories] = useState<{ [key: string]: string[] }>({});

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            setCategories(data || []);
        } catch (e) {
            console.error('Error loading categories', e);
        }
    };

    const loadAttributes = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/attributes');
            const data = await res.json();
            console.log('📊 Loaded attributes:', data);
            setAttributes(data || []);
        } catch (e) {
            console.error('Error loading attributes', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
        loadAttributes();
    }, []);

    const createAttribute = async () => {
        if (!newAttribute.name) return;
        try {
            await apiPost('/api/admin/attributes', newAttribute);
            setNewAttribute({ name: '', type: 'select', filterable: true, visibleInCatalog: true, categories: [] });
            setShowNewAttributeForm(false);
            loadAttributes();
        } catch (e) {
            console.error('Error creating attribute', e);
            alert('Fehler beim Erstellen des Attributs');
        }
    };

    const updateAttributeSettings = async (id: string, updates: { filterable?: boolean; visibleInCatalog?: boolean }) => {
        try {
            await apiPatch(`/api/admin/attributes/${id}`, updates);
            loadAttributes();
        } catch (e) {
            console.error('Error updating attribute', e);
            alert('Fehler beim Aktualisieren des Attributs');
        }
    };

    const deleteAttribute = async (id: string) => {
        if (!confirm('Attribut wirklich löschen?')) return;
        try {
            console.log('🗑️ Deleting attribute:', id);
            const response = await apiDelete(`/api/admin/attributes/${id}`);
            console.log('✅ Delete response:', response);
            loadAttributes();
        } catch (e) {
            console.error('❌ Error deleting attribute:', e);
            alert('Fehler beim Löschen des Attributs: ' + (e instanceof Error ? e.message : 'Unbekannter Fehler'));
        }
    };

    const addValue = async (attributeId: string) => {
        const value = newValues[attributeId];
        if (!value) return;
        try {
            await apiPost(`/api/admin/attributes/${attributeId}/values`, { value });
            setNewValues({ ...newValues, [attributeId]: '' });
            loadAttributes();
        } catch (e) {
            console.error('Error adding value', e);
            alert('Fehler beim Hinzufügen des Werts');
        }
    };

    const deleteValue = async (valueId: string) => {
        if (!confirm('Wert wirklich löschen?')) return;
        try {
            console.log('🗑️ Deleting value:', valueId);
            const response = await apiDelete(`/api/admin/attributes/values/${valueId}`);
            console.log('✅ Delete response:', response);
            loadAttributes();
        } catch (e) {
            console.error('❌ Error deleting value:', e);
            alert('Fehler beim Löschen des Werts: ' + (e instanceof Error ? e.message : 'Unbekannter Fehler'));
        }
    };

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedAttributes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedAttributes(newExpanded);
    };

    const toggleValueExpanded = (id: string) => {
        const newExpanded = new Set(expandedValues);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedValues(newExpanded);
    };

    const toggleAttrCategoriesExpanded = (id: string) => {
        const newExpanded = new Set(expandedAttrCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedAttrCategories(newExpanded);
    };

    const updateAttributeCategories = async (attrId: string, categories: string[]) => {
        try {
            console.log('Updating attribute categories:', { attrId, categories });
            await apiPatch(`/api/admin/attributes/${attrId}`, { categories });
            loadAttributes();
        } catch (e) {
            console.error('Error updating attribute categories', e);
            alert('Fehler beim Aktualisieren der Kategorien');
        }
    };

    const updateValueCategories = async (valueId: string, categories: string[]) => {
        try {
            console.log('Updating value categories:', { valueId, categories });
            const response = await apiPatch(`/api/admin/attributes/values/${valueId}`, { categories });
            console.log('Update response:', response);
            loadAttributes();
        } catch (e) {
            console.error('Error updating value categories', e);
            alert('Fehler beim Aktualisieren der Kategorien');
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            select: 'Auswahl',
            multiselect: 'Mehrfachauswahl',
            text: 'Text',
            number: 'Zahl',
            boolean: 'Ja/Nein',
        };
        return labels[type] || type;
    };

    return (
        <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zum Admin Bereich
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-light text-gray-900 tracking-tight mb-2">
                            Attribute verwalten
                        </h1>
                        <p className="text-sm text-gray-500">
                            Definieren Sie Attribute und deren Werte für die Produktfilterung.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowNewAttributeForm(!showNewAttributeForm)}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition shadow-sm"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Neues Attribut
                    </button>
                </div>

                {/* New Attribute Form */}
                {showNewAttributeForm && (
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 mb-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Neues Attribut erstellen</h2>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Attributname
                                </label>
                                <input
                                    type="text"
                                    value={newAttribute.name}
                                    onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="z.B. Farbe, Größe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Typ
                                </label>
                                <select
                                    value={newAttribute.type}
                                    onChange={(e) => setNewAttribute({ ...newAttribute, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    <option value="select">Auswahl</option>
                                    <option value="multiselect">Mehrfachauswahl</option>
                                    <option value="text">Text</option>
                                    <option value="number">Zahl</option>
                                    <option value="boolean">Ja/Nein</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 mb-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newAttribute.filterable}
                                    onChange={(e) => setNewAttribute({ ...newAttribute, filterable: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-900">Als Filter anzeigen</span>
                                    <p className="text-xs text-gray-500">Attribut wird in den Katalogfiltern angezeigt</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newAttribute.visibleInCatalog}
                                    onChange={(e) => setNewAttribute({ ...newAttribute, visibleInCatalog: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <div>
                                    <span className="text-sm font-medium text-gray-900">Im Katalog sichtbar</span>
                                    <p className="text-xs text-gray-500">Attribut wird auf der Produktseite angezeigt</p>
                                </div>
                            </label>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kategorien
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categories.map((cat: Category) => (
                                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newAttribute.categories.includes(cat.id)}
                                            onChange={(e) => {
                                                const updated = e.target.checked
                                                    ? [...newAttribute.categories, cat.id]
                                                    : newAttribute.categories.filter(c => c !== cat.id);
                                                setNewAttribute({ ...newAttribute, categories: updated });
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        <span className="text-sm text-gray-700">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Wählen Sie Kategorien aus, in denen dieses Attribut angezeigt werden soll</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={createAttribute}
                                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition"
                            >
                                Erstellen
                            </button>
                            <button
                                onClick={() => setShowNewAttributeForm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-50 border border-gray-200 rounded-3xl p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Attributes List */}
                {!loading && attributes.length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-10 text-center">
                        <Tag className="w-10 h-10 mx-auto text-gray-300 mb-4" />
                        <h2 className="text-lg font-medium text-gray-900 mb-2">
                            Noch keine Attribute vorhanden
                        </h2>
                        <p className="text-sm text-gray-600">
                            Erstellen Sie Ihr erstes Attribut für die Produktfilterung.
                        </p>
                    </div>
                )}

                {!loading && attributes.length > 0 && (
                    <div className="space-y-4">
                        {attributes.map((attr) => (
                            <div
                                key={attr.id}
                                className="bg-gray-50 border border-gray-200 rounded-3xl overflow-hidden hover:bg-white hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-medium text-gray-900">{attr.name}</h3>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    {getTypeLabel(attr.type)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-3">Slug: {attr.slug}</p>
                                            {attr.categories && attr.categories.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs text-gray-600">Kategorien:</span>
                                                        <button
                                                            onClick={() => toggleAttrCategoriesExpanded(attr.id)}
                                                            className="p-0.5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition"
                                                            title="Kategorien bearbeiten"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    {!expandedAttrCategories.has(attr.id) ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {attr.categories.map(catId => {
                                                                const cat = categories.find((c: Category) => c.id === catId);
                                                                return cat ? (
                                                                    <span key={catId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                                                        {cat.name}
                                                                    </span>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                                {categories.map((cat: Category) => {
                                                                    const freshAttr = attributes.find(a => a.id === attr.id);
                                                                    const freshCategories = freshAttr?.categories || [];
                                                                    return (
                                                                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={freshCategories.includes(cat.id)}
                                                                                onChange={(e) => {
                                                                                    const updated = e.target.checked
                                                                                        ? [...freshCategories, cat.id]
                                                                                        : freshCategories.filter(c => c !== cat.id);
                                                                                    updateAttributeCategories(attr.id, updated);
                                                                                }}
                                                                                className="w-3 h-3 rounded border-gray-300 text-black focus:ring-black"
                                                                            />
                                                                            <span className="text-xs text-gray-700">{cat.name}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                            <p className="text-xs text-gray-500">Leer = in allen Kategorien anzeigen</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={attr.filterable}
                                                        onChange={(e) => updateAttributeSettings(attr.id, { filterable: e.target.checked })}
                                                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                                    />
                                                    <span className="text-xs text-gray-600">Als Filter</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={attr.visibleInCatalog}
                                                        onChange={(e) => updateAttributeSettings(attr.id, { visibleInCatalog: e.target.checked })}
                                                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                                    />
                                                    <span className="text-xs text-gray-600">Im Katalog sichtbar</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleExpanded(attr.id)}
                                                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
                                            >
                                                {expandedAttributes.has(attr.id) ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => deleteAttribute(attr.id)}
                                                className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Values Section */}
                                    {expandedAttributes.has(attr.id) && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                                Werte ({attr.values?.length || 0})
                                            </h4>

                                            {/* Add new value */}
                                            {(attr.type === 'select' || attr.type === 'multiselect') && (
                                                <div className="flex gap-2 mb-4">
                                                    <input
                                                        type="text"
                                                        value={newValues[attr.id] || ''}
                                                        onChange={(e) =>
                                                            setNewValues({ ...newValues, [attr.id]: e.target.value })
                                                        }
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') addValue(attr.id);
                                                        }}
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                                                        placeholder="Neuer Wert..."
                                                    />
                                                    <button
                                                        onClick={() => addValue(attr.id)}
                                                        className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition text-sm"
                                                    >
                                                        Hinzufügen
                                                    </button>
                                                </div>
                                            )}

                                            {/* Values list */}
                                            {attr.values && attr.values.length > 0 && (
                                                <div className="space-y-2">
                                                    {attr.values.map((val) => {
                                                        // Always get fresh data from state to avoid stale closure
                                                        const freshAttr = attributes.find(a => a.id === attr.id);
                                                        const freshVal = freshAttr?.values?.find(v => v.id === val.id);
                                                        const freshCategories = freshVal?.categories || [];

                                                        return (
                                                            <div key={val.id} className="bg-white border border-gray-200 rounded-lg">
                                                                <div className="flex items-center justify-between px-3 py-2">
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <span className="text-sm font-medium">{val.value}</span>
                                                                        {freshCategories.length > 0 && (
                                                                            <span className="text-xs text-gray-500">({freshCategories.length} Kategorien)</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => toggleValueExpanded(val.id)}
                                                                            className="p-1 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-50 transition"
                                                                            title="Kategorien bearbeiten"
                                                                        >
                                                                            <Pencil className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteValue(val.id)}
                                                                            className="p-1 text-gray-400 hover:text-red-600 transition"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {expandedValues.has(val.id) && (
                                                                    <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                                                                        <p className="text-xs text-gray-600 mb-2">Kategorien für diesen Wert:</p>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {categories.map((cat: Category) => (
                                                                                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={freshCategories.includes(cat.id)}
                                                                                        onChange={(e) => {
                                                                                            const updated = e.target.checked
                                                                                                ? [...freshCategories, cat.id]
                                                                                                : freshCategories.filter(c => c !== cat.id);
                                                                                            updateValueCategories(val.id, updated);
                                                                                        }}
                                                                                        className="w-3 h-3 rounded border-gray-300 text-black focus:ring-black"
                                                                                    />
                                                                                    <span className="text-xs text-gray-700">{cat.name}</span>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-2">Leer = in allen Kategorien anzeigen, wo das Attribut verfügbar ist</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
