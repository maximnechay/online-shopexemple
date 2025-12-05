// app/api/abandoned-cart/send-emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { sendAbandonedCartEmail1h, sendAbandonedCartEmail24h, sendAbandonedCartEmail3d } from '@/lib/email/abandoned-cart';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

// Защита endpoint с помощью секретного ключа
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
    try {
        // Проверка авторизации
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const emailTypes = body.emailType ? [body.emailType] : ['1h', '24h', '3d'];

        // Валидация типов
        for (const type of emailTypes) {
            if (!['1h', '24h', '3d'].includes(type)) {
                return NextResponse.json(
                    { error: 'Invalid email type. Must be 1h, 24h, or 3d' },
                    { status: 400 }
                );
            }
        }

        const supabase = createServerSupabaseAdminClient();
        const results: any = {};
        let totalSent = 0;
        let totalErrors = 0;

        // Обработать каждый тип email
        for (const emailType of emailTypes) {
            // Получить корзины для отправки
            const { data: carts, error } = await supabase
                .rpc('get_carts_for_email_trigger', { email_type: emailType });

            if (error) {
                console.error(`Error fetching ${emailType} carts:`, error);
                results[emailType] = { error: error.message, sent: 0 };
                continue;
            }

            if (!carts || carts.length === 0) {
                results[emailType] = { message: 'No carts to process', sent: 0 };
                continue;
            }

            let successCount = 0;
            let errorCount = 0;

            // Отправить emails
            for (const cart of carts) {
                try {
                    let emailSent = false;

                    if (emailType === '1h') {
                        emailSent = await sendAbandonedCartEmail1h(cart);
                    } else if (emailType === '24h') {
                        // Генерировать купон для 24h email
                        const couponCode = await generateCouponCode(cart.id);

                        // Сохранить купон в БД
                        await supabase
                            .from('abandoned_carts')
                            .update({ coupon_code: couponCode })
                            .eq('id', cart.id);

                        emailSent = await sendAbandonedCartEmail24h({ ...cart, coupon_code: couponCode });
                    } else if (emailType === '3d') {
                        emailSent = await sendAbandonedCartEmail3d(cart);
                    }

                    if (emailSent) {
                        // Обновить статус отправки
                        const updateField = emailType === '1h' ? 'email_1h_sent' :
                            emailType === '24h' ? 'email_24h_sent' :
                                'email_3d_sent';
                        const sentAtField = emailType === '1h' ? 'email_1h_sent_at' :
                            emailType === '24h' ? 'email_24h_sent_at' :
                                'email_3d_sent_at';

                        await supabase
                            .from('abandoned_carts')
                            .update({
                                [updateField]: true,
                                [sentAtField]: new Date().toISOString(),
                            })
                            .eq('id', cart.id);

                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (emailError) {
                    console.error(`Error sending ${emailType} email for cart ${cart.id}:`, emailError);
                    errorCount++;
                }
            }

            results[emailType] = {
                processed: carts.length,
                sent: successCount,
                errors: errorCount
            };

            totalSent += successCount;
            totalErrors += errorCount;
        }

        return NextResponse.json({
            success: true,
            message: `Processed all email types`,
            totalSent,
            totalErrors,
            results,
        });

    } catch (error) {
        console.error('Error in send-emails cron:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Генерация уникального кода купона
async function generateCouponCode(cartId: string): Promise<string> {
    const prefix = 'RECOVER';
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cartPart = cartId.substring(0, 4).toUpperCase();
    return `${prefix}${cartPart}${randomPart}`;
}
