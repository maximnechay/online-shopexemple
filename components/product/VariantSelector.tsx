// components/product/VariantSelector.tsx
'use client';

import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProductVariant {
    id: string;
    name: string;
    slug: string;
    price: number;
    inStock: boolean;
    images: string[];
    attributes?: any[];
}

interface VariantSelectorProps {
    currentProductId: string;
    variants: ProductVariant[];
    variantAttributeSlug?: string; // e.g., 'volumen', 'grosse'
}

export default function VariantSelector({
    currentProductId,
    variants,
    variantAttributeSlug = 'volumen',
}: VariantSelectorProps) {
    const router = useRouter();

    if (!variants || variants.length === 0) {
        return null;
    }

    const handleVariantSelect = (slug: string) => {
        router.push(`/product/${slug}`);
    };

    // Extract variant value from attributes
    const getVariantValue = (variant: ProductVariant) => {
        if (!variant.attributes) return null;

        const attr = variant.attributes.find(
            (a: any) => a.attributes?.slug === variantAttributeSlug
        );

        return attr?.attribute_values?.value || attr?.custom_value;
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variante auswählen
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {variants.map((variant) => {
                        const isSelected = variant.id === currentProductId;
                        const variantValue = getVariantValue(variant);
                        const isAvailable = variant.inStock;

                        return (
                            <button
                                key={variant.id}
                                onClick={() => !isSelected && handleVariantSelect(variant.slug)}
                                disabled={!isAvailable || isSelected}
                                className={`
                  relative px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all
                  ${isSelected
                                        ? 'border-black bg-black text-white'
                                        : isAvailable
                                            ? 'border-gray-300 hover:border-black hover:bg-gray-50'
                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                                    }
                `}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <span className="font-semibold">{variantValue || variant.name}</span>
                                    <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                        {formatPrice(variant.price)}
                                    </span>
                                    {!isAvailable && (
                                        <span className="text-xs text-red-600">Ausverkauft</span>
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

            <p className="text-xs text-gray-500">
                * Preise können je nach Variante variieren
            </p>
        </div>
    );
}
