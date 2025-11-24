import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

// GET - получить все категории
export async function GET() {
    try {
        const supabase = createServerSupabaseAdminClient();

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Supabase error fetching categories:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to fetch categories', details: error },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch categories', details: error },
            { status: 500 }
        );
    }
}

// POST - создать новую категорию
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerSupabaseAdminClient();
        const body = await request.json();

        const { id, name, slug, description, image } = body;

        if (!id || !name) {
            return NextResponse.json(
                { error: 'ID and name are required' },
                { status: 400 }
            );
        }

        // Проверяем, существует ли категория с таким ID
        const { data: existing } = await supabase
            .from('categories')
            .select('id')
            .eq('id', id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Category with this ID already exists' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('categories')
            .insert([
                {
                    id,
                    name,
                    slug: slug || id,
                    description: description || null,
                    image: image || null,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating category:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to create category', details: error },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error creating category:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create category', details: error },
            { status: 500 }
        );
    }
}
