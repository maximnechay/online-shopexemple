// app/api/checkout/check-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/inventory/stock-manager';
import { validateSchema, checkStockSchema } from '@/lib/validation/schemas';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

/**
 * Endpoint для финальной проверки наличия товаров перед оплатой
 * 
 * POST /api/checkout/check-stock
 * Body: { items: [{ productId, quantity }] }
 * 
 * Response: {
 *   available: boolean,
 *   unavailableItems: [...],
 *   allItems: [...]
 * }
 */
export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.payment);
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

        // ✅ Zod validation
        const validation = validateSchema(checkStockSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.errors },
                { status: 400 }
            );
        }

        const { items } = validation.data;

        console.log('🔍 Checking stock availability for', items.length, 'items');

        // Проверяем наличие через stock-manager
        const result = await checkAvailability(items);

        console.log('📊 Stock check result:', {
            available: result.available,
            unavailableCount: result.unavailableItems.length,
        });

        if (!result.available) {
            console.warn('⚠️ Some items are not available:', result.unavailableItems);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ Error checking stock:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
