// app/api/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderEmails } from '@/lib/email/helpers';

/**
 * Тестовый endpoint для проверки отправки email
 * Использование: POST /api/test-email
 * Body: { "orderId": "your-order-id" }
 */
export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        console.log('🧪 Testing email send for order:', orderId);

        const result = await sendOrderEmails(orderId);

        return NextResponse.json({
            success: true,
            message: 'Email test completed',
            result,
        });
    } catch (error: any) {
        console.error('❌ Email test error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send test email' },
            { status: 500 }
        );
    }
}
