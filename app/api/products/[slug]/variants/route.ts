import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        // 1) Находим товар по slug, чтобы взять product_id
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('id, slug')
            .eq('slug', slug)
            .single();

        if (productError || !product) {
            console.error('PRODUCT FOR VARIANTS NOT FOUND', { slug, productError });
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // 2) Берем все варианты этого товара
        const { data: variants, error: variantsError } = await supabaseAdmin
            .from('product_variants')
            .select(
                `
                id,
                product_id,
                sku,
                name,
                price,
                compare_at_price,
                stock_quantity,
                in_stock,
                is_active,
                images,
                created_at,
                updated_at
            `
            )
            .eq('product_id', product.id)
            .order('created_at', { ascending: true });

        if (variantsError) {
            console.error('VARIANTS LOAD ERROR', variantsError);
            return NextResponse.json(
                { error: 'Failed to load variants' },
                { status: 500 }
            );
        }

        if (!variants || variants.length === 0) {
            return NextResponse.json(
                { variants: [] },
                {
                    headers: {
                        'Cache-Control': 'no-store, max-age=0, must-revalidate',
                    },
                }
            );
        }

        const variantIds = variants.map(v => v.id);

        // 3) Подтягиваем атрибуты для этих variant_id
        // ВАЖНО: названия отношений могут отличаться, если ты по-другому создал FK.
        // Если ругнется — проверь названия таблиц и FK.
        const { data: attributesData, error: attrsError } = await supabaseAdmin
            .from('product_attributes')
            .select(`
                id,
                product_id,
                variant_id,
                attribute_id,
                attribute_value_id,
                custom_value,
                created_at,
                attribute:attributes (
                    id,
                    slug,
                    name
                ),
                attributeValue:attribute_values (
                    id,
                    value,
                    image_url
                )
            `)
            .in('variant_id', variantIds);

        if (attrsError) {
            console.error('VARIANT ATTRIBUTES LOAD ERROR', attrsError);
        }

        const attrsByVariant = new Map<
            string,
            Array<{
                attribute_value_id?: string;
                custom_value?: string | null;
                attributes?: { slug: string; name: string };
                attribute_values?: { value: string; image_url?: string | null };
            }>
        >();

        (attributesData || []).forEach((row: any) => {
            const variantId = row.variant_id;
            if (!attrsByVariant.has(variantId)) {
                attrsByVariant.set(variantId, []);
            }

            attrsByVariant.get(variantId)!.push({
                attribute_value_id: row.attribute_value_id || undefined,
                custom_value: row.custom_value ?? null,
                attributes: row.attribute
                    ? {
                        slug: row.attribute.slug,
                        name: row.attribute.name,
                    }
                    : undefined,
                attribute_values: row.attributeValue
                    ? {
                        value: row.attributeValue.value,
                        image_url: row.attributeValue.image_url ?? null,
                    }
                    : undefined,
            });
        });

        // 4) Маппим варианты под формат VariantSelector
        const result = (variants || []).map(v => ({
            id: v.id,
            name: v.name,
            // пока у вариантов нет своего slug, используем slug продукта
            slug: product.slug,
            price: Number(v.price),
            inStock: v.in_stock && v.stock_quantity > 0,
            images: v.images ?? [],
            attributes: attrsByVariant.get(v.id) || [],
        }));

        return NextResponse.json(
            { variants: result },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            }
        );
    } catch (e) {
        console.error('Error fetching product variants:', e);
        return NextResponse.json(
            { error: 'Failed to fetch product variants' },
            { status: 500 }
        );
    }
}
