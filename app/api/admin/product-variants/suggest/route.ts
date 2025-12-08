// app/api/admin/product-variants/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

interface ProductWithAttributes {
    id: string;
    name: string;
    slug: string;
    variant_group: string | null;
    attributes: Record<string, string>;
}

/**
 * Automatically suggest variant groups based on product attributes
 * Groups products that:
 * 1. Have similar names (optional)
 * 2. Differ only in variant attributes (volumen, lange, gewicht)
 * 3. Share the same non-variant attributes
 */
export async function GET(request: NextRequest) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
        );
    }

    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

    try {
        const { searchParams } = new URL(request.url);
        const variantAttributesParam = searchParams.get('variantAttributes');
        const variantAttributeSlugs = variantAttributesParam
            ? variantAttributesParam.split(',')
            : ['volumen', 'lange', 'gewicht'];

        // Fetch all products without variant groups
        const { data: products, error: fetchError } = await supabaseAdmin
            .from('products')
            .select(`
                id,
                name,
                slug,
                variant_group,
                product_attributes (
                    attributes (
                        slug,
                        name
                    ),
                    attribute_values (
                        value
                    ),
                    custom_value
                )
            `)
            .is('variant_group', null)
            .order('name');

        if (fetchError || !products) {
            console.error('Error fetching products:', fetchError);
            return NextResponse.json(
                { error: 'Fehler beim Laden der Produkte' },
                { status: 500 }
            );
        }

        // Transform products to have flat attribute structure
        const productsWithAttributes: ProductWithAttributes[] = products.map((p: any) => {
            const attributes: Record<string, string> = {};
            p.product_attributes.forEach((pa: any) => {
                const slug = pa.attributes.slug;
                const value = pa.attribute_values?.[0]?.value || pa.custom_value;
                if (value) {
                    attributes[slug] = value;
                }
            });

            return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                variant_group: p.variant_group,
                attributes
            };
        });

        // Group products by their non-variant attributes
        const suggestedGroups: Array<{
            groupKey: string;
            products: ProductWithAttributes[];
            variantAttribute: string;
            variantValues: string[];
        }> = [];

        // Create groups based on non-variant attributes
        const groups = new Map<string, ProductWithAttributes[]>();

        for (const product of productsWithAttributes) {
            // Create a key based on non-variant attributes
            const nonVariantAttrs: Record<string, string> = {};
            Object.entries(product.attributes).forEach(([slug, value]) => {
                if (!variantAttributeSlugs.includes(slug)) {
                    nonVariantAttrs[slug] = value;
                }
            });

            // Sort keys for consistent grouping
            const groupKey = Object.keys(nonVariantAttrs)
                .sort()
                .map(k => `${k}:${nonVariantAttrs[k]}`)
                .join('|');

            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(product);
        }

        // Filter groups that have at least 2 products and differ by variant attributes
        for (const [groupKey, groupProducts] of groups.entries()) {
            if (groupProducts.length < 2) continue;

            // Check which variant attribute differs
            for (const variantSlug of variantAttributeSlugs) {
                const variantValues = groupProducts
                    .map(p => p.attributes[variantSlug])
                    .filter(v => v);

                // If this variant attribute exists and has unique values for each product
                if (
                    variantValues.length === groupProducts.length &&
                    new Set(variantValues).size === variantValues.length
                ) {
                    suggestedGroups.push({
                        groupKey,
                        products: groupProducts,
                        variantAttribute: variantSlug,
                        variantValues
                    });
                    break; // Found a valid variant attribute, no need to check others
                }
            }
        }

        // Sort by number of products in group (descending)
        suggestedGroups.sort((a, b) => b.products.length - a.products.length);

        return NextResponse.json({
            suggestedGroups: suggestedGroups.map(group => ({
                products: group.products.map(p => ({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    variantValue: p.attributes[group.variantAttribute]
                })),
                variantAttribute: group.variantAttribute,
                variantValues: group.variantValues,
                count: group.products.length
            })),
            totalGroups: suggestedGroups.length
        });
    } catch (error) {
        console.error('Error in variant suggest API:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        );
    }
}