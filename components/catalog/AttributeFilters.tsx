// components/catalog/AttributeFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Attribute } from '@/lib/types/attributes';

interface AttributeFiltersProps {
    selectedFilters: { [attributeSlug: string]: string[] };
    onFilterChange: (attributeSlug: string, valueIds: string[]) => void;
    onClearAll: () => void;
    selectedCategory?: string; // Add category filter
}

export default function AttributeFilters({
    selectedFilters,
    onFilterChange,
    onClearAll,
    selectedCategory = 'all',
}: AttributeFiltersProps) {
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttributes();
    }, []);

    const loadAttributes = async () => {
        try {
            const res = await fetch('/api/admin/attributes');
            const data = await res.json();
            // Only show filterable attributes
            const filterable = data.filter((attr: Attribute) => attr.filterable);
            setAttributes(filterable);
            // Expand all by default
            setExpandedAttributes(new Set(filterable.map((a: Attribute) => a.slug)));
        } catch (e) {
            console.error('Error loading attributes:', e);
        } finally {
            setLoading(false);
        }
    };

    // Filter attributes by selected category
    const visibleAttributes = attributes.filter(attr => {
        if (selectedCategory === 'all') return true;
        if (!attr.categories || attr.categories.length === 0) return true; // Show if no category specified
        return attr.categories.includes(selectedCategory);
    });

    const toggleExpanded = (slug: string) => {
        const newExpanded = new Set(expandedAttributes);
        if (newExpanded.has(slug)) {
            newExpanded.delete(slug);
        } else {
            newExpanded.add(slug);
        }
        setExpandedAttributes(newExpanded);
    };

    const handleCheckboxChange = (attributeSlug: string, valueId: string, checked: boolean) => {
        const current = selectedFilters[attributeSlug] || [];
        const updated = checked
            ? [...current, valueId]
            : current.filter(id => id !== valueId);
        onFilterChange(attributeSlug, updated);
    };

    const getActiveFilterCount = () => {
        return Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);
    };

    const activeCount = getActiveFilterCount();

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    if (visibleAttributes.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Header with clear button */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                    Filter
                    {activeCount > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-black text-white">
                            {activeCount}
                        </span>
                    )}
                </h3>
                {activeCount > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                        <X className="w-4 h-4" />
                        Alle löschen
                    </button>
                )}
            </div>

            {/* Attribute filters */}
            {visibleAttributes.map((attr) => {
                const isExpanded = expandedAttributes.has(attr.slug);
                const selectedValues = selectedFilters[attr.slug] || [];

                return (
                    <div key={attr.id} className="border-b border-gray-200 pb-4">
                        <button
                            onClick={() => toggleExpanded(attr.slug)}
                            className="flex items-center justify-between w-full text-left py-2 hover:text-gray-600 transition"
                        >
                            <span className="font-medium text-gray-900">
                                {attr.name}
                                {selectedValues.length > 0 && (
                                    <span className="ml-2 text-xs text-gray-500">
                                        ({selectedValues.length})
                                    </span>
                                )}
                            </span>
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="mt-2 space-y-2">
                                {attr.type === 'boolean' ? (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedValues.includes('true')}
                                            onChange={(e) =>
                                                handleCheckboxChange(attr.slug, 'true', e.target.checked)
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        <span className="text-sm text-gray-700">Ja</span>
                                    </label>
                                ) : (
                                    attr.values
                                        ?.filter((val) => {
                                            // Filter values by selected category
                                            if (selectedCategory === 'all') return true;
                                            if (!val.categories || val.categories.length === 0) return true; // Show if no category specified
                                            return val.categories.includes(selectedCategory);
                                        })
                                        .map((val) => (
                                            <label
                                                key={val.id}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedValues.includes(val.id)}
                                                    onChange={(e) =>
                                                        handleCheckboxChange(attr.slug, val.id, e.target.checked)
                                                    }
                                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                                />
                                                <span className="text-sm text-gray-700">{val.value}</span>
                                            </label>
                                        ))
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
