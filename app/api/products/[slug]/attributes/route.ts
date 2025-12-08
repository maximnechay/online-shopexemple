// app/api/products/[slug]/attributes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ProductAttribute, AttributeType } from '@/lib/types/attributes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DatabaseProductAttribute {
    id: string;
    product_id: string;
    attribute_id: string;
    attribute_value_id: string | null;
    custom_value: string | null;
    created_at: string;
    attributes?: {
        id: string;
        name: string;
        slug: string;
        type: AttributeType;
        display_order: number;
        filterable: boolean;
        visible_in_catalog: boolean;
        created_at: string;
        updated_at: string;
    };
    attribute_values?: {
        id: string;
        attribute_id: string;
        value: string;
        slug: string;
        display_order: number;
        created_at: string;
        image_url?: string | null;
    };
}

function transformProductAttributeFromDB(dbAttr: DatabaseProductAttribute): ProductAttribute {
    return {
        id: dbAttr.id,
        productId: dbAttr.product_id,
        attributeId: dbAttr.attribute_id,
        attributeValueId: dbAttr.attribute_value_id || undefined,
        customValue: dbAttr.custom_value || undefined,
        createdAt: dbAttr.created_at,
        attribute: dbAttr.attributes ? {
            id: dbAttr.attributes.id,
            name: dbAttr.attributes.name,
            slug: dbAttr.attributes.slug,
            type: dbAttr.attributes.type,
            displayOrder: dbAttr.attributes.display_order,
            filterable: dbAttr.attributes.filterable,
            visibleInCatalog: dbAttr.attributes.visible_in_catalog,
            createdAt: dbAttr.attributes.created_at,
            updatedAt: dbAttr.attributes.updated_at,
        } : undefined,
        attributeValue: dbAttr.attribute_values ? {
            id: dbAttr.attribute_values.id,
            attributeId: dbAttr.attribute_values.attribute_id,
            value: dbAttr.attribute_values.value,
            slug: dbAttr.attribute_values.slug,
            displayOrder: dbAttr.attribute_values.display_order,
            createdAt: dbAttr.attribute_values.created_at,
            imageUrl: dbAttr.attribute_values.image_url || undefined,
        } : undefined,
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        console.log('🔍 Fetching attributes for slug:', slug);

        // First, get product ID by slug
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('slug', slug)
            .single();

        if (productError || !product) {
            console.error('❌ Product not found:', slug, productError);
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        console.log('✅ Product found:', product.id);

        // Then get product attributes
        const { data, error } = await supabaseAdmin
            .from('product_attributes')
            .select(`
        *,
        attributes:attribute_id (
          id,
          name,
          slug,
          type,
          display_order,
          filterable,
          visible_in_catalog,
          created_at,
          updated_at
        ),
        attribute_values:attribute_value_id (
          id,
          attribute_id,
          value,
          slug,
          display_order,
          created_at,
          image_url
        )
      `)
            .eq('product_id', product.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching product attributes:', error);
            return NextResponse.json(
                { error: 'Failed to fetch product attributes' },
                { status: 500 }
            );
        }

        const attributes = (data || []).map(transformProductAttributeFromDB);

        return NextResponse.json(attributes, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error('Error in product attributes API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}