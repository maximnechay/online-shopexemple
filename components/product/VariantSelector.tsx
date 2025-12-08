// components/product/VariantSelector.tsx
'use client';

import { useRouter } from 'next/navigation';
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
}

const ATTRIBUTE_CONFIG: Record<string, {
    displayType: 'color' | 'button' | 'dropdown';
    colorMap?: Record<string, string>;
}> = {
    'farbe': {
        displayType: 'color',
        colorMap: {
            'Blonde': '#F5E6D3',
            'Black': '#1a1a1a',
            'Brown': '#654321',
            'Auburn': '#A52A2A',
            'Red': '#DC143C',
            'Ash Blonde': '#E6E0D4',
            'Platinum': '#E5E4E2',
            'Chestnut': '#954535',
        }
    },
    'lange': { displayType: 'button' },
    'volumen': { displayType: 'button' },
    'gewicht': { displayType: 'button' },
    'grosse': { displayType: 'button' },
};

export default function VariantSelector({
    currentProductId,
    currentProductSlug,
    currentProduct,
    variants,
}: VariantSelectorProps) {
    const router = useRouter();

    const allVariants = useMemo(() => {
        const hasCurrentProduct = variants.some(v => v.id === currentProductId);
        if (!hasCurrentProduct && currentProduct) {
            return [currentProduct, ...variants];
        }
        return variants;
    }, [variants, currentProductId, currentProduct]);

    if (!allVariants || allVariants.length < 2) {
        return null;
    }

    // Получаем текущий продукт
    const current = allVariants.find(v => v.slug === currentProductSlug) || currentProduct;

    const attributeMap = useMemo(() => {
        const map = new Map<string, Map<string, { variant: ProductVariant; value: string; imageUrl?: string }>>();

        allVariants.forEach(variant => {
            if (!variant.attributes) return;

            variant.attributes.forEach(attr => {
                const slug = attr.attributes?.slug;
                const value = attr.attribute_values?.value || attr.custom_value;
                const imageUrl = attr.attribute_values?.image_url;

                if (slug && value) {
                    if (!map.has(slug)) {
                        map.set(slug, new Map());
                    }
                    map.get(slug)!.set(value, { variant, value, imageUrl: imageUrl || undefined });
                }
            });
        });

        return map;
    }, [allVariants]);
    const isOptionCompatible = (attrSlug: string, attrValue: string) => {
        // Получаем текущие значения всех атрибутов кроме проверяемого
        const currentValues = new Map(currentAttributes);
        currentValues.set(attrSlug, attrValue);

        // Ищем вариант с такой комбинацией атрибутов
        return allVariants.some(variant => {
            if (!variant.attributes) return false;

            // Проверяем что у варианта есть все нужные атрибуты
            for (const [slug, value] of currentValues) {
                const hasAttr = variant.attributes.some(attr =>
                    attr.attributes?.slug === slug &&
                    (attr.attribute_values?.value === value || attr.custom_value === value)
                );
                if (!hasAttr) return false;
            }

            return true;
        });
    };
    const { varyingAttributes, currentAttributes } = useMemo(() => {
        const varying: Array<{
            slug: string;
            name: string;
            options: Array<{
                value: string;
                variant: ProductVariant;
                available: boolean;
                imageUrl?: string;
            }>;
        }> = [];

        // Атрибуты текущего продукта
        const currentAttrs = new Map<string, string>();
        if (current?.attributes) {
            current.attributes.forEach(attr => {
                const slug = attr.attributes?.slug;
                const value = attr.attribute_values?.value || attr.custom_value;
                if (slug && value) {
                    currentAttrs.set(slug, value);
                }
            });
        }

        attributeMap.forEach((values, slug) => {
            if (values.size > 1) {
                // Атрибут варьируется - добавляем в селекторы
                let name = slug;
                for (const variant of allVariants) {
                    const attr = variant.attributes?.find(a => a.attributes?.slug === slug);
                    if (attr?.attributes?.name) {
                        name = attr.attributes.name;
                        break;
                    }
                }

                const options = Array.from(values.values()).map(item => ({
                    value: item.value,
                    variant: item.variant,
                    available: item.variant.inStock,
                    imageUrl: item.imageUrl
                }));

                options.sort((a, b) => {
                    const aNum = parseFloat(a.value.replace(/[^0-9.]/g, ''));
                    const bNum = parseFloat(b.value.replace(/[^0-9.]/g, ''));
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return aNum - bNum;
                    }
                    return a.value.localeCompare(b.value);
                });

                varying.push({ slug, name, options });
            }
        });

        return { varyingAttributes: varying, currentAttributes: currentAttrs };
    }, [attributeMap, allVariants, current]);

    if (varyingAttributes.length === 0) {
        return null;
    }

    const handleVariantChange = (variant: ProductVariant) => {
        if (variant.slug !== currentProductSlug) {
            router.push(`/product/${variant.slug}`);
        }
    };

    const renderColorSelector = (category: typeof varyingAttributes[0]) => {
        const config = ATTRIBUTE_CONFIG[category.slug];
        const colorMap = config?.colorMap || {};
        const currentValue = currentAttributes.get(category.slug);

        return (
            <div key={category.slug} className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    {category.name}
                </label>
                <div className="flex flex-wrap gap-3">
                    {category.options.map((option) => {
                        const isSelected = option.value === currentValue;
                        const isCompatible = isOptionCompatible(category.slug, option.value);
                        const color = colorMap[option.value] || '#cccccc';
                        const hasImage = !!option.imageUrl;

                        // Не показываем несовместимые опции
                        if (!isCompatible) return null;

                        return (
                            <button
                                key={option.value}
                                onClick={() => handleVariantChange(option.variant)}
                                disabled={!option.available}
                                className={`
                                relative group
                                ${!option.available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                                title={option.value}
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
                                    {hasImage ? (
                                        <img
                                            src={option.imageUrl}
                                            alt={option.value}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : null}

                                    {!option.available && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                                            <div className="w-full h-0.5 bg-red-500 rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-center mt-1 text-gray-700 group-hover:text-gray-900">
                                    {option.value}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderButtonSelector = (category: typeof varyingAttributes[0]) => {
        const currentValue = currentAttributes.get(category.slug);

        return (
            <div key={category.slug} className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    {category.name}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {category.options.map((option) => {
                        const isSelected = option.value === currentValue;
                        const isCompatible = isOptionCompatible(category.slug, option.value);

                        // Не показываем несовместимые опции
                        if (!isCompatible) return null;

                        return (
                            <button
                                key={option.value}
                                onClick={() => handleVariantChange(option.variant)}
                                disabled={!option.available}
                                className={`
                                    relative overflow-hidden px-4 py-3 rounded-xl text-sm font-medium transition-all border-2
                                    ${isSelected
                                        ? 'border-black bg-black text-white'
                                        : option.available
                                            ? 'border-gray-300 hover:border-black hover:bg-gray-50 text-gray-900'
                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                {option.variant.images && option.variant.images[0] && (
                                    <div className="absolute inset-0 opacity-10">
                                        <img
                                            src={option.variant.images[0]}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                <div className="relative flex flex-col items-center gap-1">
                                    <span className="font-semibold">{option.value}</span>
                                    {option.variant.price !== current?.price ? (
                                        <span className={`text-xs font-medium ${isSelected ? 'opacity-80' : 'text-gray-600'}`}>
                                            {formatPrice(option.variant.price)}
                                        </span>
                                    ) : isSelected ? (
                                        <span className="text-xs opacity-80">
                                            {formatPrice(option.variant.price)}
                                        </span>
                                    ) : null}
                                </div>
                                {isSelected && (
                                    <div className="absolute top-1 right-1">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                                {!option.available && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                                        <span className="text-xs text-red-600 font-medium px-2 py-0.5 rounded">
                                            Ausverkauft
                                        </span>
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
            {varyingAttributes.map((category) => {
                const config = ATTRIBUTE_CONFIG[category.slug];
                const displayType = config?.displayType || 'button';

                if (displayType === 'color') {
                    return renderColorSelector(category);
                } else {
                    return renderButtonSelector(category);
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