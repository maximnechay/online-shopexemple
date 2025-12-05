import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { validateRequest, createCategorySchema } from '@/lib/security/validation';
import { createAuditLog } from '@/lib/security/audit-log';
import { checkAdmin } from '@/lib/auth/admin-check';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

// GET - получить все категории
export async function GET(request: NextRequest) {
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

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
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

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
        const supabase = createServerSupabaseAdminClient();
        const body = await request.json();

        // Validation
        const validation = validateRequest(createCategorySchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const { id, name, slug, description, image } = validation.data;

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

        // Audit log
        await createAuditLog({
            action: 'category.create',
            resourceType: 'category',
            resourceId: data.id,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: { name, slug },
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error creating category:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create category', details: error },
            { status: 500 }
        );
    }
}
