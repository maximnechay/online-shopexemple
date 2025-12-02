// app/api/admin/orders/[orderId]/confirm-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { createAuditLog } from '@/lib/security/audit-log';
import { decreaseStock } from '@/lib/inventory/stock-manager';

/**
 * Confirm payment for cash orders
 * This endpoint is called by admin to confirm cash payment was received
 * ONLY then the stock is decreased
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
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
        const { orderId } = await params;

        console.log('💰 Admin confirming payment for order:', orderId);

        // Get order with items
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('❌ Order not found:', orderError);
            return NextResponse.json(
                { error: 'Bestellung nicht gefunden' },
                { status: 404 }
            );
        }

        // Check if order is already paid
        if (order.payment_status === 'paid' || order.payment_status === 'completed') {
            console.log('⚠️ Order already paid, skipping stock decrease');
            return NextResponse.json(
                {
                    success: true,
                    message: 'Bestellung wurde bereits bezahlt',
                    alreadyPaid: true
                }
            );
        }

        // Check if order is pending
        if (order.payment_status !== 'pending') {
            return NextResponse.json(
                { error: `Bestellung hat ungültigen Status: ${order.payment_status}` },
                { status: 400 }
            );
        }

        // Only cash orders can be manually confirmed
        if (order.payment_method !== 'cash') {
            return NextResponse.json(
                { error: 'Nur Barzahlungen können manuell bestätigt werden' },
                { status: 400 }
            );
        }

        // Check if order has a payment_id (idempotency protection)
        if (!order.payment_id) {
            console.error('❌ Order missing payment_id');
            return NextResponse.json(
                { error: 'Bestellung fehlt payment_id' },
                { status: 400 }
            );
        }

        // Prepare items for stock decrease
        const stockItems = order.items.map((item: any) => ({
            productId: item.product_id,
            quantity: item.quantity,
            notes: `Cash payment confirmed for order ${order.order_number}`,
        }));

        console.log('📦 Decreasing stock for', stockItems.length, 'items');

        // Decrease stock (atomic operation)
        const stockResult = await decreaseStock(
            stockItems,
            order.id,
            order.payment_id
        );

        if (!stockResult.success) {
            console.error('❌ Failed to decrease stock:', stockResult.error);
            return NextResponse.json(
                { error: stockResult.error || 'Fehler beim Aktualisieren des Lagerbestands' },
                { status: 400 }
            );
        }

        console.log('✅ Stock decreased successfully');

        // Update order status to paid
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'paid',
                status: 'processing', // Move to processing after payment
            })
            .eq('id', orderId)
            .eq('payment_status', 'pending'); // Optimistic locking

        if (updateError) {
            console.error('❌ Failed to update order status:', updateError);
            // Stock was already decreased, this is a problem
            // Log it for manual review
            await createAuditLog({
                action: 'order.payment_confirm.failed',
                userEmail: 'admin',
                resourceType: 'order',
                resourceId: orderId,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                metadata: {
                    error: updateError.message,
                    note: 'Stock was decreased but order status update failed - REQUIRES MANUAL REVIEW',
                },
            });

            return NextResponse.json(
                { error: 'Fehler beim Aktualisieren des Bestellstatus' },
                { status: 500 }
            );
        }

        console.log('✅ Order status updated to paid');

        // Audit log
        await createAuditLog({
            action: 'order.payment_confirm',
            userEmail: 'admin',
            resourceType: 'order',
            resourceId: orderId,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
                orderNumber: order.order_number,
                paymentMethod: order.payment_method,
                total: order.total,
                itemsCount: stockItems.length,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Zahlung bestätigt und Lagerbestand aktualisiert',
            order: {
                id: order.id,
                orderNumber: order.order_number,
                paymentStatus: 'paid',
                status: 'processing',
            },
        });
    } catch (error: any) {
        console.error('❌ Error confirming payment:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler', details: error.message },
            { status: 500 }
        );
    }
}
