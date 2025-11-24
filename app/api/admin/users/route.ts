// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
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
                    .select('id, total_amount')
                    .eq('user_id', profile.id);

                if (ordersError) {
                    console.error('Error fetching orders for user:', ordersError);
                    return {
                        ...profile,
                        order_count: 0,
                        total_spent: 0,
                    };
                }

                const orderCount = orders?.length || 0;
                const totalSpent = orders?.reduce(
                    (sum: number, order: any) => sum + Number(order.total_amount || 0),
                    0
                ) || 0;

                return {
                    ...profile,
                    order_count: orderCount,
                    total_spent: totalSpent,
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
