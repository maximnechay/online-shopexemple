// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        // Фильтр по категории
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        // Поиск по названию
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data: products, error } = await query;

        if (error) {
            console.error('Products fetch error:', error);
            return NextResponse.json(
                { error: 'Fehler beim Laden der Produkte' },
                { status: 500 }
            );
        }

        return NextResponse.json(products || []);
    } catch (error: any) {
        console.error('Products API error:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        );
    }
}