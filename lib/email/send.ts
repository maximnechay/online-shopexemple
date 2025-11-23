// lib/email/send.ts
import { Resend } from 'resend';
import { generateOrderConfirmationHTML } from './templates/orderConfirmation';
import { generateOrderStatusHTML } from './templates/statusUpdate';
import { generateAdminOrderHTML } from './templates/adminNotification';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

export interface OrderEmailData {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: {
        street: string;
        city: string;
        postalCode: string;
        country: string;
    };
    paymentMethod: string;
    status: string;
    createdAt: string;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
    try {
        console.log('🔧 Preparing customer email for:', data.customerEmail);
        console.log('🔑 Using FROM_EMAIL:', FROM_EMAIL);
        console.log('🔑 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

        const html = generateOrderConfirmationHTML(data);

        console.log('📧 Sending email via Resend...');
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: data.customerEmail,
            subject: `Bestellbestätigung #${data.orderNumber} - Beauty Salon`,
            html,
        });

        console.log('✅ Order confirmation email sent:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('❌ Error sending order confirmation email:', error);
        return { success: false, error };
    }
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusEmail(data: OrderEmailData) {
    try {
        const html = generateOrderStatusHTML(data);

        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: data.customerEmail,
            subject: `Bestellstatus aktualisiert #${data.orderNumber} - Beauty Salon`,
            html,
        });

        console.log('Order status email sent:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error sending order status email:', error);
        return { success: false, error };
    }
}

/**
 * Send new order notification to admin
 */
export async function sendAdminOrderNotification(data: OrderEmailData) {
    try {
        console.log('🔧 Preparing admin notification for:', ADMIN_EMAIL);
        const html = generateAdminOrderHTML(data);

        console.log('📧 Sending admin notification via Resend...');
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: ADMIN_EMAIL,
            subject: `Neue Bestellung #${data.orderNumber}`,
            html,
        });

        console.log('✅ Admin notification email sent:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('❌ Error sending admin notification email:', error);
        return { success: false, error };
    }
}