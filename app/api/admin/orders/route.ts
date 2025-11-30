// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { checkAdmin } from '@/lib/auth/admin-check';

// Отключаем кеширование
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/orders
 * Получить все заказы для админ-панели
 */
export async function GET(request: NextRequest) {
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

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
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching orders:', error);
            return NextResponse.json(
                { error: 'Failed to fetch orders' },
                { status: 500 }
            );
        }

        return NextResponse.json({ orders }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error: any) {
        console.error('❌ Admin orders API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
