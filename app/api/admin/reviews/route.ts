// app/api/admin/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/reviews
 * Получить все отзывы для модерации
 */
export async function GET(request: NextRequest) {
    // Rate limiting
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

    try {
        // Создаем свежий клиент для каждого запроса
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';
        const timestamp = searchParams.get('t'); // Для предотвращения кэширования

        console.log('🔍 Fetching reviews with status:', status, 'at', timestamp);

        let query = supabase
            .from('reviews')
            .select(`
                *,
                product:products!reviews_product_id_fkey(id, name, images)
            `)
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            console.log('🔍 Applying filter: status =', status);
            query = query.eq('status', status);
        }

        const { data: reviews, error } = await query;

        if (error) {
            console.error('❌ Error fetching reviews:', error);
            return NextResponse.json(
                { error: 'Failed to fetch reviews', details: error },
                { status: 500 }
            );
        }

        console.log('✅ Fetched reviews:', reviews?.length || 0);
        console.log('📊 First review:', reviews?.[0]);
        console.log('📋 All review IDs and statuses:', reviews?.map(r => ({ id: r.id.slice(0, 8), status: r.status })));

        // Проверяем дубликаты
        const uniqueIds = new Set(reviews?.map(r => r.id));
        if (uniqueIds.size !== reviews?.length) {
            console.warn('⚠️ WARNING: Duplicate review IDs detected!');
            console.log('Total reviews:', reviews?.length, 'Unique IDs:', uniqueIds.size);
        }

        return NextResponse.json({ reviews }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error: any) {
        console.error('❌ Admin reviews API error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
