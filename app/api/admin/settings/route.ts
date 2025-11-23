// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const SETTINGS_ID = 'default';

// Преобразование из строки БД в формат для фронта
function mapDbToResponse(row: any) {
    if (!row) return null;

    return {
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
        taxRate: row.tax_rate,
        homepageHeroText: row.homepage_hero_text ?? '',
    };
}

export async function GET() {
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
    try {
        const body = await request.json();

        // тут приходят поля в camelCase от твоей формы
        const payload = {
            id: SETTINGS_ID,
            shop_name: body.shopName?.trim() || null,
            shop_subtitle: body.shopSubtitle?.trim() || null,
            support_email: body.supportEmail?.trim() || null,
            support_phone: body.supportPhone?.trim() || null,
            address_line: body.addressLine?.trim() || null,
            postal_code: body.postalCode?.trim() || null,
            city: body.city?.trim() || null,
            country: body.country?.trim() || null,
            default_currency: body.defaultCurrency?.trim() || 'EUR',
            free_shipping_from:
                typeof body.freeShippingFrom === 'number'
                    ? body.freeShippingFrom
                    : body.freeShippingFrom
                        ? Number(body.freeShippingFrom)
                        : null,
            tax_rate:
                typeof body.taxRate === 'number'
                    ? body.taxRate
                    : body.taxRate
                        ? Number(body.taxRate)
                        : null,
            homepage_hero_text: body.homepageHeroText?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
            .from('shop_settings')
            .upsert(payload, { onConflict: 'id' })
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
    } catch (e: any) {
        console.error('Settings PATCH exception:', e);
        return NextResponse.json(
            { error: e.message || 'Ungültige Anfrage' },
            { status: 400 }
        );
    }
}
