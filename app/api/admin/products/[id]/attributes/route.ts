// app/api/admin/products/[id]/attributes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

interface AttributeInput {
    attributeId: string;
    attributeValueId: string | null;
    customValue: string | null;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id: productId } = await params;
        const { attributes } = await request.json() as { attributes: AttributeInput[] };

        if (!Array.isArray(attributes)) {
            return NextResponse.json(
                { error: 'Invalid attributes format' },
                { status: 400 }
            );
        }

        // Проверяем что продукт существует
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Удаляем все существующие атрибуты продукта
        const { error: deleteError } = await supabaseAdmin
            .from('product_attributes')
            .delete()
            .eq('product_id', productId);

        if (deleteError) {
            console.error('Error deleting old attributes:', deleteError);
            return NextResponse.json(
                { error: 'Failed to update attributes' },
                { status: 500 }
            );
        }

        // Добавляем новые атрибуты
        if (attributes.length > 0) {
            const attributesToInsert = attributes.map(attr => ({
                product_id: productId,
                attribute_id: attr.attributeId,
                attribute_value_id: attr.attributeValueId,
                custom_value: attr.customValue
            }));

            const { error: insertError } = await supabaseAdmin
                .from('product_attributes')
                .insert(attributesToInsert);

            if (insertError) {
                console.error('Error inserting attributes:', insertError);
                return NextResponse.json(
                    { error: 'Failed to save attributes' },
                    { status: 500 }
                );
            }
        }

        // Загружаем обновленные атрибуты
        const { data: updatedAttributes, error: fetchError } = await supabaseAdmin
            .from('product_attributes')
            .select(`
                id,
                attribute_id,
                attribute_value_id,
                custom_value,
                attributes:attribute_id (
                    id,
                    name,
                    slug,
                    type
                ),
                attribute_values:attribute_value_id (
                    id,
                    value
                )
            `)
            .eq('product_id', productId);

        if (fetchError) {
            console.error('Error fetching updated attributes:', fetchError);
        }

        return NextResponse.json({
            success: true,
            message: 'Attributes updated successfully',
            attributes: updatedAttributes || []
        });

    } catch (error) {
        console.error('Error in update product attributes API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}