// app/api/checkout/check-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/inventory/stock-manager';

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
    try {
        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Items array is required' },
                { status: 400 }
            );
        }

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
