// lib/email/helpers.ts
import { supabaseAdmin } from '@/lib/supabase/admin';
import { OrderEmailData } from './send';

/**
 * Получить данные заказа из БД и подготовить для отправки email
 */
export async function getOrderEmailData(orderId: string): Promise<OrderEmailData | null> {
    try {
        // Получаем заказ с позициями
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    product_name,
                    product_price,
                    quantity
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('❌ Error fetching order for email:', orderError);
            return null;
        }

        // Формируем данные для email
        const items = order.order_items.map((item: any) => ({
            name: item.product_name,
            quantity: item.quantity,
            price: parseFloat(item.product_price),
        }));

        const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        // Получаем настройки доставки из БД
        const { data: settings } = await supabaseAdmin
            .from('shop_settings')
            .select('shipping_cost, free_shipping_from')
            .eq('id', 'default')
            .single();

        console.log('🔍 Raw settings from DB:', settings);

        const baseShippingCost = parseFloat(settings?.shipping_cost) || 10;
        const freeShippingFrom = parseFloat(settings?.free_shipping_from) || 49;

        console.log('📦 Shipping settings:', {
            baseShippingCost,
            freeShippingFrom,
            subtotal,
            deliveryMethod: order.delivery_method
        });

        // Рассчитываем стоимость доставки
        let shipping = 0;
        if (order.delivery_method === 'delivery') {
            shipping = subtotal >= freeShippingFrom ? 0 : baseShippingCost;
        }

        console.log('💰 Final shipping cost:', shipping);

        const taxRate = 0.19; // 19% MwSt
        const tax = subtotal * taxRate;
        const total = parseFloat(order.total_amount);

        const emailData: OrderEmailData = {
            orderId: order.id,
            orderNumber: order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            items,
            subtotal,
            shipping,
            tax,
            total,
            shippingAddress: {
                street: order.delivery_address || '',
                city: order.delivery_city || '',
                postalCode: order.delivery_postal_code || '',
                country: 'Deutschland',
            },
            paymentMethod: order.payment_method || 'card',
            status: order.status,
            createdAt: order.created_at,
        };

        return emailData;
    } catch (error) {
        console.error('❌ Error preparing order email data:', error);
        return null;
    }
}

/**
 * Отправить email подтверждения и уведомление админу после успешной оплаты
 */
export async function sendOrderEmails(orderId: string) {
    console.log('📧 Starting email send process for order:', orderId);

    const { sendOrderConfirmationEmail, sendAdminOrderNotification } = await import('./send');

    const orderData = await getOrderEmailData(orderId);

    if (!orderData) {
        console.error('❌ Could not fetch order data for emails');
        return { success: false, error: 'Order data not found' };
    }

    console.log('✅ Order data retrieved:', {
        orderNumber: orderData.orderNumber,
        customerEmail: orderData.customerEmail,
        total: orderData.total,
        itemsCount: orderData.items.length
    });

    // Отправляем оба email параллельно
    console.log('📤 Sending customer email to:', orderData.customerEmail);
    console.log('📤 Sending admin email to:', process.env.ADMIN_EMAIL);

    const [customerResult, adminResult] = await Promise.allSettled([
        sendOrderConfirmationEmail(orderData),
        sendAdminOrderNotification(orderData),
    ]);

    console.log('📧 Customer email result:', customerResult);
    console.log('📧 Admin email result:', adminResult);

    return {
        success: true,
        customerEmail: customerResult.status === 'fulfilled' ? customerResult.value : null,
        adminEmail: adminResult.status === 'fulfilled' ? adminResult.value : null,
    };
}
