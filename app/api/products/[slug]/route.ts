import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { transformProductFromDB } from '@/lib/supabase/helpers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const { data: product, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Transform data from snake_case to camelCase
        const transformedProduct = transformProductFromDB(product);

        return NextResponse.json(transformedProduct);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}