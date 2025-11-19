// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            customerInfo,
            items,
            subtotal,
            shipping,
            total,
            deliveryMethod,
            paymentMethod,
            notes
        } = body;

        // Генерируем номер заказа
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

        // Создаём заказ
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                order_number: orderNumber,
                email: customerInfo.email,
                phone: customerInfo.phone,
                first_name: customerInfo.firstName,
                last_name: customerInfo.lastName,
                street: customerInfo.street,
                house_number: customerInfo.houseNumber,
                postal_code: customerInfo.postalCode,
                city: customerInfo.city,
                subtotal,
                shipping,
                total,
                delivery_method: deliveryMethod,
                payment_method: paymentMethod,
                payment_status: 'pending',
                status: 'pending',
                notes: notes || null
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Создаём позиции заказа
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.product.id,
            product_name: item.product.name,
            product_price: item.product.price,
            quantity: item.quantity,
            total: item.product.price * item.quantity
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                orderNumber: order.order_number
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}