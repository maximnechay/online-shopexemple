// app/api/orders/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;

    console.log('🔍 Fetching orders for user:', userId);

    const { data, error } = await supabaseAdmin
        .rpc('get_user_orders_with_items', { p_user_id: userId });

    if (error) {
        console.error('❌ Load orders error:', error);
        return NextResponse.json(
            { error: 'Failed to load orders' },
            { status: 500 }
        );
    }

    console.log('✅ Orders loaded:', data?.length || 0);

    return NextResponse.json(data || [], {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}