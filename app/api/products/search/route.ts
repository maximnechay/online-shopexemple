import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
        return NextResponse.json([]);
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%,tags.cs.{${query}}`)
            .eq('in_stock', true)
            .limit(5);

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error searching products:', error);
        return NextResponse.json(
            { error: 'Failed to search products' },
            { status: 500 }
        );
    }
}