// lib/types/attributes.ts
export type AttributeType = 'select' | 'multiselect' | 'text' | 'number' | 'boolean';

export interface Attribute {
    id: string;
    name: string;
    slug: string;
    type: AttributeType;
    displayOrder: number;
    filterable: boolean;
    visibleInCatalog: boolean;
    categories?: string[]; // Array of category slugs
    createdAt: string;
    updatedAt: string;
    values?: AttributeValue[];
}

export interface AttributeValue {
    id: string;
    attributeId: string;
    value: string;
    slug: string;
    displayOrder: number;
    categories?: string[]; // Array of category slugs
    createdAt: string;
    imageUrl?: string;
}

export interface ProductAttribute {
    id: string;
    productId: string;
    attributeId: string;
    attributeValueId?: string;
    customValue?: string;
    createdAt: string;
    // Populated fields
    attribute?: Attribute;
    attributeValue?: AttributeValue;
}

export interface DatabaseAttribute {
    id: string;
    name: string;
    slug: string;
    type: AttributeType;
    display_order: number;
    filterable: boolean;
    visible_in_catalog: boolean;
    categories?: string[];
    created_at: string;
    updated_at: string;
}

export interface DatabaseAttributeValue {
    id: string;
    attribute_id: string;
    value: string;
    slug: string;
    display_order: number;
    categories?: string[];
    created_at: string;
    image_url?: string;
}

// Product Variants
export interface ProductVariant {
    id: string;
    parentProductId: string;
    variantProductId: string;
    variantType: string;
    createdAt: string;
    // Populated fields
    product?: {
        id: string;
        name: string;
        slug: string;
        price: number;
        inStock: boolean;
        images: string[];
    };
}

export interface DatabaseProductVariant {
    id: string;
    parent_product_id: string;
    variant_product_id: string;
    variant_type: string;
    created_at: string;
}

export interface DatabaseProductAttribute {
    id: string;
    product_id: string;
    attribute_id: string;
    attribute_value_id?: string;
    custom_value?: string;
    created_at: string;
}

export interface ProductWithAttributes {
    id: string;
    name: string;
    attributes: {
        attributeName: string;
        attributeSlug: string;
        value: string;
        valueSlug?: string;
    }[];
}

export interface FilterOptions {
    attributes: {
        [key: string]: string[]; // attributeSlug -> array of valueIds
    };
    priceRange?: {
        min: number;
        max: number;
    };
    inStock?: boolean;
}