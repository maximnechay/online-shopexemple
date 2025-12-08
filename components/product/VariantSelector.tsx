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
        attribute_values?: { value: string };
    }>;
}

interface VariantSelectorProps {
    currentProductId: string;
    currentProductSlug: string;
    currentProduct?: ProductVariant; // Добавили текущий продукт
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

    // ИСПРАВЛЕНИЕ: Добавляем текущий продукт к вариантам если его там нет
    const allVariants = useMemo(() => {
        // Проверяем есть ли текущий продукт в массиве вариантов
        const hasCurrentProduct = variants.some(v => v.id === currentProductId);

        // Если текущего продукта нет и он передан - добавляем
        if (!hasCurrentProduct && currentProduct) {
            return [currentProduct, ...variants];
        }

        return variants;
    }, [variants, currentProductId, currentProduct]);

    // Проверка: нужно минимум 2 продукта для показа вариантов
    if (!allVariants || allVariants.length < 2) {
        return null;
    }

    // Извлекаем все уникальные атрибуты из всех вариантов
    const attributeMap = useMemo(() => {
        const map = new Map<string, Map<string, { variant: ProductVariant; value: string }>>();

        allVariants.forEach(variant => {
            if (!variant.attributes) return;

            variant.attributes.forEach(attr => {
                const slug = attr.attributes?.slug;
                const value = attr.attribute_values?.value || attr.custom_value;

                if (slug && value) {
                    if (!map.has(slug)) {
                        map.set(slug, new Map());
                    }
                    map.get(slug)!.set(value, { variant, value });
                }
            });
        });

        return map;
    }, [allVariants]);

    // Определяем какие атрибуты варьируются (имеют разные значения)
    const varyingAttributes = useMemo(() => {
        const varying: Array<{
            slug: string;
            name: string;
            options: Array<{
                value: string;
                variant: ProductVariant;
                available: boolean;
            }>;
        }> = [];

        attributeMap.forEach((values, slug) => {
            // Атрибут варьируется если есть больше 1 уникального значения
            if (values.size > 1) {
                // Получаем имя атрибута
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
                    available: item.variant.inStock
                }));

                // Сортируем опции (числа по возрастанию, текст по алфавиту)
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

        return varying;
    }, [attributeMap, allVariants]);

    // Если нет варьирующихся атрибутов - не показываем компонент
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

        return (
            <div key={category.slug} className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    {category.name}
                </label>
                <div className="flex flex-wrap gap-3">
                    {category.options.map((option) => {
                        const isSelected = option.variant.id === currentProductId;
                        const color = colorMap[option.value] || '#cccccc';

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
                                        w-12 h-12 rounded-full border-2 transition-all
                                        ${isSelected
                                            ? 'border-black ring-2 ring-offset-2 ring-black'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }
                                    `}
                                    style={{ backgroundColor: color }}
                                >
                                    {isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Check
                                                className="w-5 h-5"
                                                style={{
                                                    color: color === '#1a1a1a' ? 'white' : 'black'
                                                }}
                                            />
                                        </div>
                                    )}
                                    {!option.available && (
                                        <div className="absolute inset-0 flex items-center justify-center">
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
        return (
            <div key={category.slug} className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    {category.name}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {category.options.map((option) => {
                        const isSelected = option.variant.id === currentProductId;

                        return (
                            <button
                                key={option.value}
                                onClick={() => handleVariantChange(option.variant)}
                                disabled={!option.available}
                                className={`
                                    relative px-4 py-3 rounded-xl text-sm font-medium transition-all border-2
                                    ${isSelected
                                        ? 'border-black bg-black text-white'
                                        : option.available
                                            ? 'border-gray-300 hover:border-black hover:bg-gray-50 text-gray-900'
                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="font-semibold">{option.value}</span>
                                    {isSelected && (
                                        <span className="text-xs opacity-80">
                                            {formatPrice(option.variant.price)}
                                        </span>
                                    )}
                                </div>
                                {isSelected && (
                                    <div className="absolute top-1 right-1">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                                {!option.available && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs text-red-600 font-medium bg-white px-2 py-0.5 rounded">
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