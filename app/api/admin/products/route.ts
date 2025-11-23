// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(body)
            .select()
            .single();

        if (error) {
            console.error(error);
            return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
