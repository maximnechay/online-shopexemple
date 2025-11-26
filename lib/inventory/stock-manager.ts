// lib/inventory/stock-manager.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export type StockEventType = 'purchase' | 'refund' | 'manual_adjust' | 'cancelled';

export interface StockChange {
    productId: string;
    quantity: number;
    orderId?: string;
    paymentId?: string;
    notes?: string;
}

export interface StockAvailability {
    productId: string;
    available: boolean;
    requested: number;
    inStock: number;
    productName?: string;
}

/**
 * Check if products are available in stock
 * Does NOT modify stock levels
 */
export async function checkAvailability(
    items: Array<{ productId: string; quantity: number }>
): Promise<{
    available: boolean;
    unavailableItems: StockAvailability[];
    allItems: StockAvailability[];
}> {
    const supabase = supabaseAdmin;

    // Get current stock levels for all products
    const productIds = items.map(item => item.productId);
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .in('id', productIds);

    if (error) {
        console.error('Error checking stock availability:', error);
        throw new Error('Failed to check stock availability');
    }

    const unavailableItems: StockAvailability[] = [];
    const allItems: StockAvailability[] = [];

    for (const item of items) {
        const product = products?.find(p => p.id === item.productId);

        if (!product) {
            unavailableItems.push({
                productId: item.productId,
                available: false,
                requested: item.quantity,
                inStock: 0,
                productName: 'Unknown Product',
            });
            allItems.push(unavailableItems[unavailableItems.length - 1]);
            continue;
        }

        const isAvailable = product.stock_quantity >= item.quantity;
        const stockInfo: StockAvailability = {
            productId: product.id,
            available: isAvailable,
            requested: item.quantity,
            inStock: product.stock_quantity,
            productName: product.name,
        };

        allItems.push(stockInfo);
        if (!isAvailable) {
            unavailableItems.push(stockInfo);
        }
    }

    return {
        available: unavailableItems.length === 0,
        unavailableItems,
        allItems,
    };
}

/**
 * Decrease stock for purchased items
 * Called ONLY when payment is confirmed
 * 
 * АТОМАРНАЯ ОПЕРАЦИЯ через PostgreSQL транзакцию:
 * - Использует RPC function с FOR UPDATE блокировкой
 * - Проверяет stock >= quantity для ВСЕХ товаров
 * - Если хоть один товар недоступен - RAISE EXCEPTION откатывает ВСЮ транзакцию
 * - Ошибка прилетает в error (не в data.success)
 * - Полностью защищено от race condition
 */
export async function decreaseStock(
    items: StockChange[],
    orderId: string,
    paymentId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = supabaseAdmin;

    try {
        // Prepare items for PostgreSQL function
        const itemsJson = items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes || `Purchase for order`,
        }));

        // Call PostgreSQL RPC function - это АТОМАРНАЯ ТРАНЗАКЦИЯ
        // Внутри функции:
        // BEGIN (неявно)
        //   FOR each item:
        //     SELECT ... FOR UPDATE (блокирует строку)
        //     IF stock < quantity THEN собираем ошибки
        //     UPDATE stock = stock - quantity
        //     INSERT INTO stock_logs
        //   IF есть ошибки THEN RAISE EXCEPTION → ROLLBACK всей транзакции
        // COMMIT (неявно, только если не было RAISE EXCEPTION)
        const { data, error } = await supabase.rpc('decrease_stock_atomic', {
            items: itemsJson,
            p_order_id: orderId,
            p_payment_id: paymentId,
        });

        // Если PostgreSQL RAISE EXCEPTION - прилетает в error
        if (error) {
            console.error('❌ Atomic stock decrease failed:', error);
            return {
                success: false,
                error: error.message || 'Failed to decrease stock',
            };
        }

        // Если функция вернула data без ошибки - успех
        return { success: true };
    } catch (error) {
        console.error('❌ Error in decreaseStock:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to decrease stock',
        };
    }
}

/**
 * Increase stock for refunded items
 * Called when order is refunded
 */
export async function increaseStock(
    items: StockChange[],
    orderId: string,
    paymentId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = supabaseAdmin;

    try {
        // Get current stock levels
        const productIds = items.map(item => item.productId);
        const { data: products, error } = await supabase
            .from('products')
            .select('id, stock_quantity')
            .in('id', productIds);

        if (error) {
            throw new Error('Failed to fetch product stock');
        }

        // Increase stock for each item
        for (const item of items) {
            const product = products?.find(p => p.id === item.productId);
            if (!product) {
                console.error(`Product ${item.productId} not found for refund`);
                continue;
            }

            const stockBefore = product.stock_quantity;
            const stockAfter = stockBefore + item.quantity;

            // Update product stock
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock_quantity: stockAfter })
                .eq('id', item.productId);

            if (updateError) {
                console.error('Error increasing stock:', updateError);
                throw new Error(`Failed to increase stock for product ${item.productId}`);
            }

            // Log the stock change
            await logStockChange({
                productId: item.productId,
                orderId,
                eventType: 'refund',
                quantityChange: item.quantity,
                stockBefore,
                stockAfter,
                paymentId,
                notes: item.notes || 'Refund processed',
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error in increaseStock:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to increase stock',
        };
    }
}

/**
 * Log stock changes for audit trail
 */
async function logStockChange(params: {
    productId: string;
    orderId: string;
    eventType: StockEventType;
    quantityChange: number;
    stockBefore: number;
    stockAfter: number;
    paymentId?: string;
    notes?: string;
}): Promise<void> {
    const supabase = supabaseAdmin;

    const { error } = await supabase.from('stock_logs').insert({
        product_id: params.productId,
        order_id: params.orderId,
        event_type: params.eventType,
        quantity_change: params.quantityChange,
        stock_before: params.stockBefore,
        stock_after: params.stockAfter,
        payment_id: params.paymentId,
        notes: params.notes,
    });

    if (error) {
        console.error('Error logging stock change:', error);
        // Don't throw - logging should not break the main flow
    }
}

/**
 * Manual stock adjustment (for admin use)
 * Uses RELATIVE changes (+N or -N) instead of absolute values
 * 
 * @param productId - Product UUID
 * @param quantityChange - Positive for increase (+10), negative for decrease (-5)
 * @param reason - Human-readable reason (required for audit)
 * @param adminUserId - Admin user ID performing the adjustment
 * 
 * Examples:
 *   adjustStock(productId, +50, "Поступление со склада", adminId)
 *   adjustStock(productId, -3, "Брак при проверке", adminId)
 */
export async function adjustStock(
    productId: string,
    quantityChange: number,
    reason: string,
    adminUserId: string
): Promise<{ success: boolean; error?: string; result?: any }> {
    const supabase = supabaseAdmin;

    try {
        if (!reason || reason.trim().length === 0) {
            return {
                success: false,
                error: 'Reason is required for stock adjustment',
            };
        }

        // Call PostgreSQL RPC function - АТОМАРНАЯ ОПЕРАЦИЯ
        // Использует FOR UPDATE блокировку и проверяет что stock >= 0
        const { data, error } = await supabase.rpc('adjust_stock_manual', {
            p_product_id: productId,
            p_quantity_change: quantityChange,
            p_reason: reason,
            p_admin_user_id: adminUserId,
        });

        if (error) {
            console.error('❌ Manual stock adjustment failed:', error);
            return {
                success: false,
                error: error.message || 'Failed to adjust stock',
            };
        }

        console.log('✅ Stock adjusted:', data);
        return { success: true, result: data };
    } catch (error) {
        console.error('❌ Error in adjustStock:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to adjust stock',
        };
    }
}

/**
 * @deprecated Use adjustStock with relative changes instead
 * This function is kept for backward compatibility but should not be used
 */
export async function setStockAbsolute(
    productId: string,
    newStock: number,
    notes: string
): Promise<{ success: boolean; error?: string }> {
    console.warn('⚠️ setStockAbsolute is deprecated. Use adjustStock with relative changes.');

    const supabase = supabaseAdmin;

    try {
        // Get current stock
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', productId)
            .single();

        if (fetchError || !product) {
            throw new Error('Product not found');
        }

        const stockBefore = product.stock_quantity;
        const quantityChange = newStock - stockBefore;

        // Use the proper adjustStock function
        return await adjustStock(productId, quantityChange, notes, '00000000-0000-0000-0000-000000000000');
    } catch (error) {
        console.error('Error in setStockAbsolute:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to set stock',
        };
    }
}
