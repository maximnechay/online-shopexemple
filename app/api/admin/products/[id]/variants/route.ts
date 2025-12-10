// app/api/admin/products/[id]/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { checkAdmin } from '@/lib/auth/admin-check';

interface VariantAttributeInput {
    attributeId: string;
    attributeValueId?: string | null;
    customValue?: string | null;
}

interface VariantInput {
    id: string;
    sku: string;
    name: string;
    price: number;
    compare_at_price: number | null;
    stock_quantity: number;
    in_stock: boolean;
    is_active: boolean;
    images: string[];
    attributes?: VariantAttributeInput[];
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

    try {
        const { id: productId } = await params;
        const body = await request.json();
        const variants: VariantInput[] = body.variants;

        if (!Array.isArray(variants)) {
            return NextResponse.json(
                { error: 'Invalid variants format' },
                { status: 400 }
            );
        }

        const ids = variants.map(v => v.id).filter(Boolean);

        // 1) Удаляем варианты, которых нет в payload
        if (ids.length > 0) {
            const { error: deleteOldError } = await supabaseAdmin
                .from('product_variants')
                .delete()
                .eq('product_id', productId)
                .not('id', 'in', `(${ids.join(',')})`);

            if (deleteOldError) {
                console.error('Error deleting old variants:', deleteOldError);
                // не падаем, просто лог
            }
        } else {
            // если variants пустой, удалим все варианты
            const { error: deleteAllError } = await supabaseAdmin
                .from('product_variants')
                .delete()
                .eq('product_id', productId);

            if (deleteAllError) {
                console.error('Error deleting all variants:', deleteAllError);
            }
        }

        // 2) upsert всех переданных вариантов
        const variantsToUpsert = variants.map(v => ({
            id: v.id,
            product_id: productId,
            sku: v.sku,
            name: v.name,
            price: v.price,
            compare_at_price: v.compare_at_price,
            stock_quantity: v.stock_quantity,
            in_stock: v.in_stock,
            is_active: v.is_active,
            images: v.images
        }));

        const { data: upserted, error: upsertError } = await supabaseAdmin
            .from('product_variants')
            .upsert(variantsToUpsert, { onConflict: 'id' })
            .select('*');

        if (upsertError) {
            console.error('Error upserting variants:', upsertError);
            return NextResponse.json(
                { error: 'Failed to save variants' },
                { status: 500 }
            );
        }

        // 3) Пересоздаем product_attributes для этого товара
        // Сначала удаляем все старые атрибуты для product_id
        const { error: deleteAttrsError } = await supabaseAdmin
            .from('product_attributes')
            .delete()
            .eq('product_id', productId);

        if (deleteAttrsError) {
            console.error('Error deleting old product attributes:', deleteAttrsError);
            // теоретически можно тут вернуть 500, но оставим как лог
        }

        // Сбор всех атрибутов из variants[].attributes
        const attributesToInsert: any[] = [];

        for (const variant of variants) {
            const attrs = variant.attributes || [];
            if (!attrs.length) continue;

            for (const attr of attrs) {
                // пропускаем, если вообще ничего нет
                if (!attr.attributeId) continue;
                if (!attr.attributeValueId && !attr.customValue) continue;

                attributesToInsert.push({
                    product_id: productId,
                    variant_id: variant.id,
                    attribute_id: attr.attributeId,
                    attribute_value_id: attr.attributeValueId ?? null,
                    custom_value: attr.customValue ?? null
                });
            }
        }

        if (attributesToInsert.length > 0) {
            const { error: attrsInsertError } = await supabaseAdmin
                .from('product_attributes')
                .insert(attributesToInsert);

            if (attrsInsertError) {
                console.error('Error inserting product attributes:', attrsInsertError);
            }
        }

        // 4) Обновляем parent product с диапазоном цен и общим stock
        if (upserted && upserted.length > 0) {
            const prices = upserted.map(v => Number(v.price));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const totalStock = upserted.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

            await supabaseAdmin
                .from('products')
                .update({
                    price: minPrice,
                    max_price: maxPrice !== minPrice ? maxPrice : null,
                    stock_quantity: totalStock,
                    in_stock: totalStock > 0
                })
                .eq('id', productId);
        }

        return NextResponse.json({
            success: true,
            variants: upserted
        });
    } catch (err) {
        console.error('Error updating variants:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
