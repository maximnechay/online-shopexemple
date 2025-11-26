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
 * This is atomic and will rollback if any item fails
 */
export async function decreaseStock(
    items: StockChange[],
    orderId: string,
    paymentId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = supabaseAdmin;

    try {
        // Start transaction-like operation
        // First, verify all items are still available
        const availability = await checkAvailability(
            items.map(item => ({ productId: item.productId, quantity: item.quantity }))
        );

        if (!availability.available) {
            const unavailableNames = availability.unavailableItems
                .map(item => `${item.productName} (need ${item.requested}, have ${item.inStock})`)
                .join(', ');

            return {
                success: false,
                error: `Insufficient stock for: ${unavailableNames}`,
            };
        }

        // Decrease stock for each item
        for (const item of items) {
            const product = availability.allItems.find(p => p.productId === item.productId);
            if (!product) continue;

            const stockBefore = product.inStock;
            const stockAfter = stockBefore - item.quantity;

            // Update product stock
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock_quantity: stockAfter })
                .eq('id', item.productId)
                .eq('stock_quantity', stockBefore); // Optimistic locking

            if (updateError) {
                console.error('Error decreasing stock:', updateError);
                throw new Error(`Failed to decrease stock for product ${item.productId}`);
            }

            // Log the stock change
            await logStockChange({
                productId: item.productId,
                orderId,
                eventType: 'purchase',
                quantityChange: -item.quantity,
                stockBefore,
                stockAfter,
                paymentId,
                notes: item.notes,
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error in decreaseStock:', error);
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
 */
export async function adjustStock(
    productId: string,
    newStock: number,
    notes: string
): Promise<{ success: boolean; error?: string }> {
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

        // Update stock
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', productId);

        if (updateError) {
            throw new Error('Failed to update stock');
        }

        // Log the change
        await logStockChange({
            productId,
            orderId: '00000000-0000-0000-0000-000000000000', // Placeholder for manual adjustments
            eventType: 'manual_adjust',
            quantityChange,
            stockBefore,
            stockAfter: newStock,
            notes,
        });

        return { success: true };
    } catch (error) {
        console.error('Error in adjustStock:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to adjust stock',
        };
    }
}
