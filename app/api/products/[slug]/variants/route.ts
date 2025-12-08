// app/api/products/[slug]/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // First, get product ID by slug
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('id, variant_group')
            .eq('slug', slug)
            .single();

        if (productError || !product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // If product has a variant_group, get all products in that group
        if (product.variant_group) {
            const { data: variants, error: variantsError } = await supabaseAdmin
                .from('products')
                .select('id, name, slug, price, in_stock, images')
                .eq('variant_group', product.variant_group)
                .neq('id', product.id)
                .order('price', { ascending: true });

            if (variantsError) {
                console.error('Error fetching variants by group:', variantsError);
                return NextResponse.json({ variants: [] });
            }

            // Get attributes for each variant to show in selector
            const variantsWithAttributes = await Promise.all(
                (variants || []).map(async (variant) => {
                    const { data: attrs } = await supabaseAdmin
                        .from('product_attributes')
                        .select(`
              attribute_value_id,
              custom_value,
              attributes:attribute_id (slug, name),
              attribute_values:attribute_value_id (value)
            `)
                        .eq('product_id', variant.id);

                    return {
                        id: variant.id,
                        name: variant.name,
                        slug: variant.slug,
                        price: variant.price,
                        inStock: variant.in_stock,
                        images: variant.images,
                        attributes: attrs || [],
                    };
                })
            );

            return NextResponse.json({
                variants: variantsWithAttributes,
                groupBy: 'variant_group',
            });
        }

        // Fallback: check product_variants table
        const { data: variantLinks, error: linksError } = await supabaseAdmin
            .from('product_variants')
            .select(`
        variant_type,
        variant_product:variant_product_id (
          id,
          name,
          slug,
          price,
          in_stock,
          images
        )
      `)
            .eq('parent_product_id', product.id);

        if (linksError) {
            console.error('Error fetching variant links:', linksError);
            return NextResponse.json({ variants: [] });
        }

        const variants = (variantLinks || []).map((link: any) => ({
            ...link.variant_product,
            variantType: link.variant_type,
        }));

        return NextResponse.json({
            variants,
            groupBy: 'parent_child',
        });
    } catch (error) {
        console.error('Error in product variants API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
