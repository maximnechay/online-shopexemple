// components/product/VariantSelector.tsx
'use client';

import { formatPrice } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useMemo } from 'react';

interface ProductVariant {
    id: string;
    name: string;
    slug: string;
    price: number;
    inStock: boolean;
    images: string[];
    attributes?: Array<{
        attribute_value_id?: string;
        custom_value?: string | null;
        attributes?: { slug: string; name: string };
        attribute_values?: { value: string; image_url?: string | null };
    }>;
}

interface VariantSelectorProps {
    currentProductId: string;
    currentProductSlug: string;
    currentProduct?: ProductVariant;
    variants: ProductVariant[];
    onVariantChange?: (variant: ProductVariant) => void;
    selectedVariant?: ProductVariant | null;
}

const ATTRIBUTE_CONFIG: Record<string, {
    displayType: 'color' | 'button';
    colorMap?: Record<string, string>;
}> = {
    'farbe': {
        displayType: 'color',
        colorMap: {
            'Dark Brown #2': '#3d2817',
            'Golden Blonde #610': '#F5E6D3',
            'Blonde': '#F5E6D3',
            'Black': '#1a1a1a',
            'Brown': '#654321',
        }
    },
    'lange': { displayType: 'button' },
    'length': { displayType: 'button' },
    'volumen': { displayType: 'button' },
    'gewicht': { displayType: 'button' },
    'weight': { displayType: 'button' },
    'grosse': { displayType: 'button' },
};

export default function VariantSelector({
    currentProductId,
    currentProductSlug,
    currentProduct,
    variants,
    onVariantChange,
    selectedVariant,
}: VariantSelectorProps) {

    const allVariants = useMemo(() => {
        // НЕ добавляем главный продукт в список вариантов
        // Варианты - это только дочерние продукты
        return variants;
    }, [variants]);

    if (!allVariants || allVariants.length < 2) {
        return null;
    }

    // Используем selectedVariant если есть, иначе текущий продукт
    const current = selectedVariant || currentProduct;
    const currentAttributes = useMemo(() => {
        const attrs = new Map<string, string>();
        if (current?.attributes) {
            current.attributes.forEach(attr => {
                const slug = attr.attributes?.slug;
                const value = attr.attribute_values?.value || attr.custom_value;
                if (slug && value) {
                    attrs.set(slug, value);
                }
            });
        }
        return attrs;
    }, [current]);

    const varyingAttributes = useMemo(() => {
        const attrMap = new Map<string, {
            name: string;
            values: Set<string>;
            images: Map<string, string>;
        }>();

        allVariants.forEach(variant => {
            if (!variant.attributes) return;

            variant.attributes.forEach(attr => {
                const slug = attr.attributes?.slug;
                const value = attr.attribute_values?.value || attr.custom_value;
                const name = attr.attributes?.name || slug;
                const imageUrl = attr.attribute_values?.image_url;

                if (slug && value) {
                    if (!attrMap.has(slug)) {
                        attrMap.set(slug, {
                            name: name || slug,
                            values: new Set(),
                            images: new Map()
                        });
                    }
                    attrMap.get(slug)!.values.add(value);
                    if (imageUrl) {
                        attrMap.get(slug)!.images.set(value, imageUrl);
                    }
                }
            });
        });

        const varying: Array<{
            slug: string;
            name: string;
            values: Array<{ value: string; imageUrl?: string }>;
        }> = [];

        attrMap.forEach((data, slug) => {
            if (data.values.size > 1) {
                const sortedValues = Array.from(data.values).sort((a, b) => {
                    const aNum = parseFloat(a.replace(/[^0-9.]/g, ''));
                    const bNum = parseFloat(b.replace(/[^0-9.]/g, ''));
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return aNum - bNum;
                    }
                    return a.localeCompare(b);
                });

                varying.push({
                    slug,
                    name: data.name,
                    values: sortedValues.map(v => ({
                        value: v,
                        imageUrl: data.images.get(v)
                    }))
                });
            }
        });

        return varying;
    }, [allVariants]);

    if (varyingAttributes.length === 0) {
        return null;
    }

    const findBestVariant = (changedSlug: string, newValue: string): ProductVariant | null => {
        let bestMatch: ProductVariant | null = null;
        let bestScore = -1;

        // Ищем только среди variants, НЕ включая главный продукт
        for (const variant of variants) {
            if (!variant.attributes) continue;

            const variantAttrs = new Map<string, string>();
            variant.attributes.forEach(attr => {
                const slug = attr.attributes?.slug;
                const value = attr.attribute_values?.value || attr.custom_value;
                if (slug && value) {
                    variantAttrs.set(slug, value);
                }
            });

            if (variantAttrs.get(changedSlug) !== newValue) {
                continue;
            }

            let score = 0;
            currentAttributes.forEach((currentValue, slug) => {
                if (slug !== changedSlug && variantAttrs.get(slug) === currentValue) {
                    score++;
                }
            });

            if (score > bestScore) {
                bestScore = score;
                bestMatch = variant;
            }
        }

        return bestMatch;
    };

    const handleChange = (attrSlug: string, value: string) => {
        const bestVariant = findBestVariant(attrSlug, value);

        if (bestVariant && onVariantChange) {
            onVariantChange(bestVariant);
        }
    };

    const renderColorSelector = (attribute: typeof varyingAttributes[0]) => {
        const config = ATTRIBUTE_CONFIG[attribute.slug];
        const colorMap = config?.colorMap || {};
        const currentValue = currentAttributes.get(attribute.slug);

        return (
            <div key={attribute.slug} className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    {attribute.name}
                </label>
                <div className="flex flex-wrap gap-3">
                    {attribute.values.map(({ value, imageUrl }) => {
                        const isSelected = value === currentValue;
                        const color = colorMap[value] || '#cccccc';
                        const hasImage = !!imageUrl;

                        const bestVariant = findBestVariant(attribute.slug, value);
                        const isAvailable = bestVariant?.inStock ?? true;

                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleChange(attribute.slug, value);
                                }}
                                disabled={!isAvailable}
                                className={`
                                    relative group
                                    ${!isAvailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                                    transition-transform
                                `}
                                title={value}
                            >
                                <div
                                    className={`
                                        w-12 h-12 rounded-full border-2 transition-all overflow-hidden
                                        ${isSelected
                                            ? 'border-black ring-2 ring-offset-2 ring-black'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }
                                    `}
                                    style={hasImage ? {} : { backgroundColor: color }}
                                >
                                    {hasImage && (
                                        <img
                                            src={imageUrl}
                                            alt={value}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="text-xs text-center mt-1 text-gray-700">
                                    {value}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderButtonSelector = (attribute: typeof varyingAttributes[0]) => {
        const currentValue = currentAttributes.get(attribute.slug);

        return (
            <div key={attribute.slug} className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    {attribute.name}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {attribute.values.map(({ value }) => {
                        const isSelected = value === currentValue;
                        const bestVariant = findBestVariant(attribute.slug, value);
                        const isAvailable = bestVariant?.inStock ?? true;

                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleChange(attribute.slug, value);
                                }}
                                disabled={!isAvailable}
                                className={`
                                    relative overflow-hidden px-4 py-3 rounded-xl text-sm font-medium transition-all border-2
                                    ${isSelected
                                        ? 'border-black bg-black text-white'
                                        : isAvailable
                                            ? 'border-gray-300 hover:border-black hover:bg-gray-50 text-gray-900'
                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div className="relative flex flex-col items-center gap-1">
                                    <span className="font-semibold">{value}</span>
                                    {bestVariant && bestVariant.price !== current?.price && (
                                        <span className={`text-xs ${isSelected ? 'opacity-80' : 'text-gray-600'}`}>
                                            {formatPrice(bestVariant.price)}
                                        </span>
                                    )}
                                </div>
                                {isSelected && (
                                    <div className="absolute top-1 right-1">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {varyingAttributes.map((attribute) => {
                const config = ATTRIBUTE_CONFIG[attribute.slug];
                const displayType = config?.displayType || 'button';

                if (displayType === 'color') {
                    return renderColorSelector(attribute);
                } else {
                    return renderButtonSelector(attribute);
                }
            })}

            <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                    * Preise können je nach gewählter Variante variieren
                </p>
            </div>
        </div>
    );
}