// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { checkAdmin } from '@/lib/auth/admin-check';
import { createProductSchema, validateSchema } from '@/lib/validation/schemas';
import { sanitizeProductDescription } from '@/lib/utils/sanitize';
import { safeLog } from '@/lib/utils/logger';

function makeSlug(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')      // пробелы → -
        .replace(/[^a-z0-9-]/g, '') // убираем всё лишнее
        .slice(0, 60);
}

export async function GET(request: NextRequest) {
    // ✅ Admin authentication
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

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

    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('ADMIN GET products error:', error);
        return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    // ✅ Admin authentication
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

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
        const body = await request.json();

        // ✅ Валидация с Zod
        const validation = validateSchema(createProductSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const validated = validation.data;

        // ✅ Санитизация описания
        const cleanDescription = sanitizeProductDescription(validated.description);

        // Генерация slug
        const slug = makeSlug(validated.name);

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                ...validated,
                description: cleanDescription,
                slug,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ ADMIN POST product error:', error);
            return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
        }

        safeLog('✅ Product created by admin:', { productId: data.id, name: data.name });
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ ADMIN POST error:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
