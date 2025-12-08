// app/api/admin/product-variants/link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

interface ProductWithAttributes {
    id: string;
    name: string;
    attributes: Array<{
        attribute_id: string;
        attribute_slug: string;
        attribute_name: string;
        attribute_value_id: string | null;
        value: string | null;
        custom_value: string | null;
    }>;
}

/**
 * Check if products can be variants based on their attributes
 * Products are valid variants if they:
 * 1. Have similar base names (optional)
 * 2. Differ only in specific variant attributes (like volume, length, color)
 * 3. Have same values for non-variant attributes
 */
function validateVariantGroup(
    products: ProductWithAttributes[],
    variantAttributeSlugs: string[]
): { valid: boolean; reason?: string } {
    if (products.length < 2) {
        return { valid: false, reason: 'Mindestens 2 Produkte erforderlich' };
    }

    // Get all attribute slugs from all products
    const allAttributeSlugs = new Set<string>();
    products.forEach(product => {
        product.attributes.forEach(attr => {
            allAttributeSlugs.add(attr.attribute_slug);
        });
    });

    // Separate variant and non-variant attributes
    const variantAttrs = new Set(variantAttributeSlugs);
    const nonVariantAttrs = Array.from(allAttributeSlugs).filter(slug => !variantAttrs.has(slug));

    // Check if products have at least one variant attribute
    const hasVariantAttribute = products.every(product =>
        product.attributes.some(attr => variantAttrs.has(attr.attribute_slug))
    );

    if (!hasVariantAttribute) {
        return {
            valid: false,
            reason: 'Produkte müssen mindestens ein Variantenattribut haben: ' + variantAttributeSlugs.join(', ')
        };
    }

    // Check if non-variant attributes match across all products
    for (const attrSlug of nonVariantAttrs) {
        const values = products
            .map(p => {
                const attr = p.attributes.find(a => a.attribute_slug === attrSlug);
                return attr ? (attr.value || attr.custom_value) : null;
            })
            .filter(v => v !== null);

        // If attribute exists in multiple products, values should match
        if (values.length > 1 && new Set(values).size > 1) {
            return {
                valid: false,
                reason: `Nicht-Varianten-Attribut "${attrSlug}" hat unterschiedliche Werte in den Produkten`
            };
        }
    }

    // Check if variant attribute values are unique
    for (const variantSlug of variantAttributeSlugs) {
        const values = products
            .map(p => {
                const attr = p.attributes.find(a => a.attribute_slug === variantSlug);
                return attr ? (attr.value || attr.custom_value) : null;
            })
            .filter(v => v !== null);

        if (values.length > 0 && new Set(values).size !== values.length) {
            return {
                valid: false,
                reason: `Variantenattribut "${variantSlug}" hat doppelte Werte`
            };
        }
    }

    return { valid: true };
}

export async function POST(request: NextRequest) {
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
        const { productIds, variantGroup, variantAttributes } = await request.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
            return NextResponse.json(
                { error: 'Mindestens 2 Produkt-IDs erforderlich' },
                { status: 400 }
            );
        }

        // Default variant attributes for hair extensions
        const variantAttributeSlugs = variantAttributes || ['volumen', 'lange', 'gewicht'];

        // Fetch products with their attributes
        const { data: products, error: fetchError } = await supabaseAdmin
            .from('products')
            .select(`
                id,
                name,
                product_attributes!inner (
                    attribute_id,
                    attribute_value_id,
                    custom_value,
                    attributes!inner (
                        slug,
                        name
                    ),
                    attribute_values (
                        value
                    )
                )
            `)
            .in('id', productIds);

        if (fetchError || !products) {
            console.error('Error fetching products:', fetchError);
            return NextResponse.json(
                { error: 'Fehler beim Laden der Produkte' },
                { status: 500 }
            );
        }

        // Transform the data structure
        const productsWithAttributes: ProductWithAttributes[] = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            attributes: p.product_attributes.map((pa: any) => ({
                attribute_id: pa.attribute_id,
                attribute_slug: pa.attributes.slug,
                attribute_name: pa.attributes.name,
                attribute_value_id: pa.attribute_value_id,
                value: pa.attribute_values?.[0]?.value || null,
                custom_value: pa.custom_value
            }))
        }));

        // Validate that products can be variants
        const validation = validateVariantGroup(productsWithAttributes, variantAttributeSlugs);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.reason || 'Produkte können nicht als Varianten verknüpft werden' },
                { status: 400 }
            );
        }

        // Update all products with the same variant_group
        const { error: updateError } = await supabaseAdmin
            .from('products')
            .update({ variant_group: variantGroup })
            .in('id', productIds);

        if (updateError) {
            console.error('Error linking products:', updateError);
            return NextResponse.json(
                { error: 'Fehler beim Verknüpfen der Produkte' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            variantGroup,
            productsLinked: productIds.length,
            variantAttributes: variantAttributeSlugs
        });
    } catch (error) {
        console.error('Error in product variants link API:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        );
    }
}