// app/api/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderEmails } from '@/lib/email/helpers';
import { rateLimit } from '@/lib/security/rate-limit';

/**
 * Тестовый endpoint для проверки отправки email
 * ⚠️ ЗАЩИЩЁН: Только для development
 * Использование: POST /api/test-email
 * Body: { "orderId": "your-order-id" }
 */
export async function POST(request: NextRequest) {
    // ✅ КРИТИЧНАЯ ЗАЩИТА: Только в development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'Endpoint not available' },
            { status: 404 }
        );
    }

    // ✅ Rate limiting даже в development (2 запроса в час)
    const rateLimitResult = rateLimit(request, { maxRequests: 2, windowMs: 3600000 });
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many test emails. Wait 1 hour.' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

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
