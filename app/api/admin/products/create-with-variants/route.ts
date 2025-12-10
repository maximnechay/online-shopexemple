// app/api/admin/products/create-with-variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

interface VariantInput {
    name: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    stockQuantity: number;
    images?: string[];
    attributes: Array<{
        attributeId: string;
        attributeValueId?: string;
        customValue?: string;
    }>;
}

interface CreateProductWithVariantsInput {
    name: string;
    slug: string;
    description: string;
    category: string;
    brand?: string;
    images: string[];
    tags: string[];
    variants: VariantInput[];
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
        const data: CreateProductWithVariantsInput = await request.json();

        // Basic validation
        if (!data.name || !data.slug || !data.variants || data.variants.length === 0) {
            return NextResponse.json(
                { error: 'Name, slug und mindestens ein Variant erforderlich' },
                { status: 400 }
            );
        }

        // 1) Create parent product
        const { data: parentProduct, error: productError } = await supabaseAdmin
            .from('products')
            .insert({
                name: data.name,
                slug: data.slug,
                description: data.description,
                category: data.category,
                brand: data.brand,
                images: data.images,
                tags: data.tags,
                is_variant_parent: true,
                in_stock: true,
                price: 0,          // вычислим после по вариантам
                stock_quantity: 0  // сумма по вариантам
            })
            .select()
            .single();

        if (productError || !parentProduct) {
            console.error('Error creating parent product:', productError);
            return NextResponse.json(
                { error: 'Fehler beim Erstellen des Produkts: ' + (productError?.message || 'Unknown error') },
                { status: 500 }
            );
        }

        // 2) Create variants
        const variantsToInsert = data.variants.map(v => ({
            product_id: parentProduct.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            compare_at_price: v.compareAtPrice,
            stock_quantity: v.stockQuantity,
            in_stock: v.stockQuantity > 0,
            images: v.images || [],
            is_active: true
        }));

        const { data: createdVariants, error: variantsError } = await supabaseAdmin
            .from('product_variants')
            .insert(variantsToInsert)
            .select();

        if (variantsError || !createdVariants) {
            console.error('Error creating variants:', variantsError);
            // rollback parent
            await supabaseAdmin.from('products').delete().eq('id', parentProduct.id);
            return NextResponse.json(
                { error: 'Fehler beim Erstellen der Varianten' },
                { status: 500 }
            );
        }

        // 3) Create attributes for variants
        const attributesToInsert: {
            product_id: string;
            variant_id: string;
            attribute_id: string;
            attribute_value_id: string | null;
            custom_value: string | null;
        }[] = [];

        data.variants.forEach((variantInput, index) => {
            const variantId = createdVariants[index].id;

            variantInput.attributes.forEach(attr => {
                attributesToInsert.push({
                    product_id: parentProduct.id,
                    variant_id: variantId,
                    attribute_id: attr.attributeId,
                    attribute_value_id: attr.attributeValueId || null,
                    custom_value: attr.customValue || null
                });
            });
        });

        if (attributesToInsert.length > 0) {
            const { error: attributesError } = await supabaseAdmin
                .from('product_attributes')
                .insert(attributesToInsert);

            if (attributesError) {
                console.error('Error creating variant attributes:', attributesError);
                // можно оставить как лог и не падать, чтобы продукт все равно создался
            }
        }

        // 4) Update parent product with price range and total stock
        const prices = data.variants.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const totalStock = data.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

        await supabaseAdmin
            .from('products')
            .update({
                price: minPrice,
                max_price: maxPrice !== minPrice ? maxPrice : null,
                stock_quantity: totalStock
            })
            .eq('id', parentProduct.id);

        return NextResponse.json({
            success: true,
            product: parentProduct,
            variants: createdVariants,
            variantCount: createdVariants.length
        });
    } catch (error) {
        console.error('Error in create product with variants API:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        );
    }
}
