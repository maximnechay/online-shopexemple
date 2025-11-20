// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET - получить заказы пользователя
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Получаем заказы пользователя
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    product_name,
                    product_price,
                    quantity,
                    total
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Добавляем количество позиций в каждый заказ
        const ordersWithCount = orders?.map(order => ({
            ...order,
            items_count: order.order_items?.length || 0
        })) || [];

        return NextResponse.json({
            success: true,
            orders: ordersWithCount
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

// POST - создать новый заказ
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            userId,
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

        // Создаём заказ с user_id (если пользователь авторизован)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                order_number: orderNumber,
                user_id: userId || null,
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