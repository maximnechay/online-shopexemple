// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        const userId = params.id;
        const supabase = supabaseAdmin;

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get user orders with items count
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                order_number,
                status,
                total,
                created_at,
                payment_method,
                street,
                house_number,
                postal_code,
                city,
                order_items (
                    id
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
        }

        // Format orders with items count
        const formattedOrders = (orders || []).map((order: any) => {
            const shippingAddress = [
                order.street,
                order.house_number,
                order.postal_code,
                order.city
            ].filter(Boolean).join(', ');

            return {
                id: order.id,
                order_number: order.order_number,
                status: order.status,
                total: order.total,
                created_at: order.created_at,
                payment_method: order.payment_method,
                shipping_address: shippingAddress,
                items_count: order.order_items?.length || 0,
            };
        });

        // Calculate statistics
        const totalOrders = formattedOrders.length;
        const totalSpent = formattedOrders.reduce(
            (sum, order) => sum + Number(order.total || 0),
            0
        );
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const lastOrderDate = formattedOrders.length > 0 ? formattedOrders[0].created_at : null;
        const firstOrderDate = formattedOrders.length > 0
            ? formattedOrders[formattedOrders.length - 1].created_at
            : null;

        const stats = {
            total_orders: totalOrders,
            total_spent: totalSpent,
            average_order_value: averageOrderValue,
            last_order_date: lastOrderDate,
            first_order_date: firstOrderDate,
        };

        return NextResponse.json({
            success: true,
            user: profile,
            orders: formattedOrders,
            stats,
        });
    } catch (error) {
        console.error('Error in GET /api/admin/users/[id]:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}
