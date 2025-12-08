// app/api/admin/attributes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

// GET - List all attributes with their values
export async function GET(request: NextRequest) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
        );
    }

    try {
        const { data: attributes, error } = await supabaseAdmin
            .from('attributes')
            .select(`
                *,
                attribute_values (
                    id,
                    value,
                    slug,
                    display_order,
                    categories
                )
            `)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('❌ Error fetching attributes:', error);
            return NextResponse.json({ error: 'Failed to fetch attributes' }, { status: 500 });
        }

        // Transform to camelCase
        const transformed = attributes.map((attr: any) => ({
            id: attr.id,
            name: attr.name,
            slug: attr.slug,
            type: attr.type,
            displayOrder: attr.display_order,
            filterable: attr.filterable,
            visibleInCatalog: attr.visible_in_catalog,
            categories: attr.categories || [],
            createdAt: attr.created_at,
            updatedAt: attr.updated_at,
            values: attr.attribute_values?.map((val: any) => ({
                id: val.id,
                value: val.value,
                slug: val.slug,
                displayOrder: val.display_order,
                categories: val.categories || [],
            })) || [],
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('❌ GET attributes error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new attribute
export async function POST(request: NextRequest) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
        );
    }

    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

    try {
        const body = await request.json();
        const { name, type, filterable = true, visibleInCatalog = true, displayOrder = 0, categories = [] } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
        }

        // Generate slug
        const slug = name
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const { data, error } = await supabaseAdmin
            .from('attributes')
            .insert({
                name,
                slug,
                type,
                filterable,
                visible_in_catalog: visibleInCatalog,
                display_order: displayOrder,
                categories,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating attribute:', error);
            return NextResponse.json({ error: 'Failed to create attribute' }, { status: 500 });
        }

        return NextResponse.json({
            id: data.id,
            name: data.name,
            slug: data.slug,
            type: data.type,
            displayOrder: data.display_order,
            filterable: data.filterable,
            visibleInCatalog: data.visible_in_catalog,
            categories: data.categories || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        });
    } catch (error) {
        console.error('❌ POST attribute error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
