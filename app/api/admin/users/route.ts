// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

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
        const supabase = supabaseAdmin;

        // Get all profiles with order statistics
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select(`
                id,
                email,
                full_name,
                phone,
                newsletter_enabled,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            throw profilesError;
        }

        // Get order statistics for each user
        const usersWithStats = await Promise.all(
            (profiles || []).map(async (profile: any) => {
                const { data: orders, error: ordersError } = await supabase
                    .from('orders')
                    .select('id, total, created_at')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false });

                if (ordersError) {
                    console.error('Error fetching orders for user:', ordersError);
                    return {
                        ...profile,
                        order_count: 0,
                        total_spent: 0,
                        last_order_date: null,
                        average_order_value: 0,
                    };
                }

                const orderCount = orders?.length || 0;
                const totalSpent = orders?.reduce(
                    (sum: number, order: any) => sum + Number(order.total || 0),
                    0
                ) || 0;
                const lastOrderDate = orders && orders.length > 0 ? orders[0].created_at : null;
                const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

                return {
                    ...profile,
                    order_count: orderCount,
                    total_spent: totalSpent,
                    last_order_date: lastOrderDate,
                    average_order_value: averageOrderValue,
                };
            })
        );

        return NextResponse.json({
            success: true,
            users: usersWithStats,
        });
    } catch (error) {
        console.error('Error in GET /api/admin/users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
