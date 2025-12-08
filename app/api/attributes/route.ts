// app/api/attributes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { data: attributes, error } = await supabaseAdmin
            .from('attributes')
            .select('id, name, slug, type, display_order, filterable, visible_in_catalog')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching attributes:', error);
            return NextResponse.json(
                { error: 'Failed to fetch attributes' },
                { status: 500 }
            );
        }

        return NextResponse.json(attributes || []);

    } catch (error) {
        console.error('Error in attributes API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}