// app/api/reviews/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews/stats?product_ids=id1,id2,id3
 * Получить статистику отзывов для нескольких продуктов одним запросом
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productIdsParam = searchParams.get('product_ids');

        if (!productIdsParam) {
            return NextResponse.json(
                { error: 'product_ids parameter is required' },
                { status: 400 }
            );
        }

        const productIds = productIdsParam.split(',').filter(Boolean);

        if (productIds.length === 0) {
            return NextResponse.json({ stats: {} });
        }

        // Получаем все одобренные отзывы для указанных продуктов
        const { data: reviews, error } = await supabaseAdmin
            .from('reviews')
            .select('product_id, rating')
            .eq('status', 'approved')
            .in('product_id', productIds);

        if (error) {
            console.error('❌ Error fetching review stats:', error);
            return NextResponse.json(
                { error: 'Failed to fetch review stats' },
                { status: 500 }
            );
        }

        // Группируем по product_id и считаем статистику
        const stats: Record<string, { average: number; total: number }> = {};

        productIds.forEach(productId => {
            const productReviews = reviews?.filter(r => r.product_id === productId) || [];
            const total = productReviews.length;
            const average = total > 0
                ? productReviews.reduce((sum, r) => sum + r.rating, 0) / total
                : 0;

            stats[productId] = { average, total };
        });

        return NextResponse.json({ stats }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            }
        });
    } catch (error: any) {
        console.error('❌ Review stats API error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
