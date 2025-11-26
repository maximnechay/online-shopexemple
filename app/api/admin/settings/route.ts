// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

const SETTINGS_ID = 'default';

// Преобразование из строки БД в формат для фронта
function mapDbToResponse(row: any) {
    if (!row) return null;

    return {
        // Основная информация
        shopName: row.shop_name ?? '',
        shopSubtitle: row.shop_subtitle ?? '',
        supportEmail: row.support_email ?? '',
        supportPhone: row.support_phone ?? '',
        addressLine: row.address_line ?? '',
        postalCode: row.postal_code ?? '',
        city: row.city ?? '',
        country: row.country ?? 'Deutschland',
        defaultCurrency: row.default_currency ?? 'EUR',
        freeShippingFrom: row.free_shipping_from,
        shippingCost: row.shipping_cost ?? 4.99,
        taxRate: row.tax_rate,
        homepageHeroText: row.homepage_hero_text ?? '',

        // Контактная информация
        address: row.address ?? '',
        phone: row.phone ?? '',
        email: row.email ?? '',
        openHours: row.open_hours ?? '',
        mapEmbedUrl: row.map_embed_url ?? '',
    };
}

export async function GET(request: NextRequest) {
    // Rate limiting - public endpoint for reading settings
    const rateLimitResult = rateLimit(request, RATE_LIMITS.public);
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
        const { data, error } = await supabaseAdmin
            .from('shop_settings')
            .select('*')
            .eq('id', SETTINGS_ID)
            .single();

        if (error) {
            // если нет строки - пусть фронт покажет дефолты
            if (error.code === 'PGRST116') {
                return NextResponse.json({}, { status: 404 });
            }

            console.error('Settings load error:', error);
            return NextResponse.json(
                { error: 'Fehler beim Laden der Einstellungen' },
                { status: 500 }
            );
        }

        return NextResponse.json(mapDbToResponse(data));
    } catch (e) {
        console.error('Settings GET exception:', e);
        return NextResponse.json(
            { error: 'Serverfehler' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    // Rate limiting - admin endpoint
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

        // Преобразуем данные из camelCase в snake_case для БД
        const payload = {
            id: SETTINGS_ID,

            // Основная информация
            shop_name: body.shopName?.trim() || null,
            shop_subtitle: body.shopSubtitle?.trim() || null,
            support_email: body.supportEmail?.trim() || null,
            support_phone: body.supportPhone?.trim() || null,
            address_line: body.addressLine?.trim() || null,
            postal_code: body.postalCode?.trim() || null,
            city: body.city?.trim() || null,
            country: body.country?.trim() || 'Deutschland',
            default_currency: body.defaultCurrency?.trim() || 'EUR',
            free_shipping_from:
                typeof body.freeShippingFrom === 'number'
                    ? body.freeShippingFrom
                    : body.freeShippingFrom
                        ? Number(body.freeShippingFrom)
                        : null,
            shipping_cost:
                typeof body.shippingCost === 'number'
                    ? body.shippingCost
                    : body.shippingCost
                        ? Number(body.shippingCost)
                        : 4.99,
            tax_rate:
                typeof body.taxRate === 'number'
                    ? body.taxRate
                    : body.taxRate
                        ? Number(body.taxRate)
                        : null,
            homepage_hero_text: body.homepageHeroText?.trim() || null,

            // Контактная информация
            address: body.address?.trim() || null,
            phone: body.phone?.trim() || null,
            email: body.email?.trim() || null,
            open_hours: body.openHours?.trim() || null,
            map_embed_url: body.mapEmbedUrl?.trim() || null,

            updated_at: new Date().toISOString(),
        };

        console.log('Saving settings payload:', payload);

        // Используем upsert для создания или обновления
        const { data, error } = await supabaseAdmin
            .from('shop_settings')
            .upsert(payload, {
                onConflict: 'id',
            })
            .select()
            .single();

        if (error) {
            console.error('Settings save error:', error);
            return NextResponse.json(
                { error: 'Fehler beim Speichern der Einstellungen' },
                { status: 500 }
            );
        }

        return NextResponse.json(mapDbToResponse(data));
    } catch (err: any) {
        console.error('Settings PATCH exception:', err);
        return NextResponse.json(
            { error: 'Serverfehler' },
            { status: 500 }
        );
    }
}