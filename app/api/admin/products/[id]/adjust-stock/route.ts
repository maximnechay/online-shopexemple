// app/api/admin/products/[id]/adjust-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { adjustStock } from '@/lib/inventory/stock-manager';
import { createAuditLog } from '@/lib/security/audit-log';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

/**
 * Admin endpoint для ручной корректировки склада
 * 
 * POST /api/admin/products/[id]/adjust-stock
 * 
 * Body:
 * {
 *   "quantityChange": +10 или -5,
 *   "reason": "Поступление со склада" или "Брак при проверке"
 * }
 * 
 * ВАЖНО: Использует относительные изменения (+N / -N), а не абсолютные значения
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Zu viele Anfragen' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    try {
        // 1. Получаем сессию через cookies (Next.js App Router way)
        const cookieStore = cookies();
        const allCookies = cookieStore.getAll();

        console.log('All cookies:', allCookies.map(c => c.name));

        let accessToken = null;

        // Supabase может разбивать токены на несколько частей: .0, .1, .2 и т.д.
        const baseName = 'sb-ftnesgtxepluwpicbydh-auth-token';
        const tokenParts = allCookies
            .filter(c => c.name.startsWith(baseName))
            .sort((a, b) => {
                // Сортируем по номеру части (.0, .1, .2)
                const numA = parseInt(a.name.split('.')[1] || '0');
                const numB = parseInt(b.name.split('.')[1] || '0');
                return numA - numB;
            })
            .map(c => c.value);

        if (tokenParts.length > 0) {
            // Объединяем части токена
            let fullToken = tokenParts.join('');
            console.log(`Assembled token from ${tokenParts.length} parts`);

            // Если токен в base64, декодируем
            if (fullToken.startsWith('base64-')) {
                try {
                    fullToken = Buffer.from(fullToken.substring(7), 'base64').toString('utf-8');
                    console.log('✅ Decoded base64 token');
                } catch (e) {
                    console.error('Failed to decode base64:', e);
                }
            }

            // Парсим JSON токена
            try {
                const tokenData = JSON.parse(fullToken);
                accessToken = tokenData.access_token || tokenData.accessToken;
                console.log('✅ Extracted access_token from assembled cookie');
            } catch (e) {
                console.error('Failed to parse token JSON:', e);
            }
        }

        // Если не нашли, пробуем другие варианты
        if (!accessToken) {
            const cookieNames = [
                'sb-access-token',
                'supabase-auth-token'
            ];

            for (const name of cookieNames) {
                const cookie = cookieStore.get(name);
                if (cookie?.value) {
                    accessToken = cookie.value;
                    console.log(`Found token in cookie: ${name}`);
                    break;
                }
            }
        }

        if (!accessToken) {
            console.error('No access token found in cookies');
            return NextResponse.json(
                { error: 'Unauthorized - please login again' },
                { status: 401 }
            );
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

        if (authError || !user) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { error: 'Invalid token or session expired' },
                { status: 401 }
            );
        }

        console.log(`✅ User authenticated: ${user.email}`);

        // 2. Проверка роли админа
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            console.warn(`⚠️ Non-admin user ${user.id} tried to adjust stock`);
            return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // 3. Валидация параметров
        const { id } = params;
        const body = await request.json();
        const { quantityChange, reason } = body;

        if (typeof quantityChange !== 'number' || isNaN(quantityChange)) {
            return NextResponse.json(
                { error: 'quantityChange must be a number (e.g., +10 or -5)' },
                { status: 400 }
            );
        }

        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'reason is required' },
                { status: 400 }
            );
        }

        if (reason.length > 500) {
            return NextResponse.json(
                { error: 'reason is too long (max 500 characters)' },
                { status: 400 }
            );
        }

        console.log(`📦 Admin ${user.email} adjusting stock for product ${id}:`, {
            quantityChange,
            reason,
        });

        // 4. Выполняем корректировку
        const result = await adjustStock(
            id,
            quantityChange,
            reason,
            user.id
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to adjust stock' },
                { status: 400 }
            );
        }

        // 5. Логируем действие админа
        await createAuditLog({
            userId: user.id,
            action: 'product.update',
            resourceType: 'product',
            resourceId: id,
            metadata: {
                operation: 'stock_adjusted',
                quantityChange,
                reason,
                stockBefore: result.result?.stock_before,
                stockAfter: result.result?.stock_after,
                productName: result.result?.product_name,
            },
        });

        console.log('✅ Stock adjusted successfully:', result.result);

        return NextResponse.json({
            success: true,
            data: result.result,
            newStock: result.result?.stock_after,
            stockBefore: result.result?.stock_before,
            productName: result.result?.product_name,
        });
    } catch (error) {
        console.error('❌ Error adjusting stock:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
