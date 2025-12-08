// app/api/attributes/[id]/values/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: attributeId } = await params;

        const { data: values, error } = await supabaseAdmin
            .from('attribute_values')
            .select('id, value, slug, display_order')
            .eq('attribute_id', attributeId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching attribute values:', error);
            return NextResponse.json(
                { error: 'Failed to fetch attribute values' },
                { status: 500 }
            );
        }

        return NextResponse.json(values || []);

    } catch (error) {
        console.error('Error in attribute values API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}