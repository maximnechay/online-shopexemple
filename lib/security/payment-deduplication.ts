// lib/security/payment-deduplication.ts
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Проверяет, не был ли платёж уже обработан
 */
export async function isPaymentProcessed(paymentId: string, provider: 'stripe' | 'paypal'): Promise<boolean> {
    try {
        const supabase = createServerSupabaseAdminClient();

        const { data, error } = await supabase
            .from('processed_payments')
            .select('id')
            .eq('payment_id', paymentId)
            .eq('provider', provider)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking payment:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error in isPaymentProcessed:', error);
        return false;
    }
}

/**
 * Отмечает платёж как обработанный
 */
export async function markPaymentAsProcessed(
    paymentId: string,
    provider: 'stripe' | 'paypal',
    orderId: string,
    amount: number
): Promise<void> {
    try {
        const supabase = createServerSupabaseAdminClient();

        const { error } = await supabase
            .from('processed_payments')
            .insert([{
                payment_id: paymentId,
                provider,
                order_id: orderId,
                amount,
                processed_at: new Date().toISOString(),
            }]);

        if (error) {
            console.error('Error marking payment as processed:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in markPaymentAsProcessed:', error);
        throw error;
    }
}

/**
 * Проверяет идемпотентность запроса с помощью idempotency key
 */
export async function checkIdempotency(key: string): Promise<{
    exists: boolean;
    response?: any;
}> {
    try {
        const supabase = createServerSupabaseAdminClient();

        const { data, error } = await supabase
            .from('idempotency_keys')
            .select('response')
            .eq('key', key)
            .gte('expires_at', new Date().toISOString())
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking idempotency:', error);
            return { exists: false };
        }

        if (data) {
            return { exists: true, response: data.response };
        }

        return { exists: false };
    } catch (error) {
        console.error('Error in checkIdempotency:', error);
        return { exists: false };
    }
}

/**
 * Сохраняет idempotency key с результатом
 */
export async function saveIdempotency(key: string, response: any, ttlSeconds: number = 86400): Promise<void> {
    try {
        const supabase = createServerSupabaseAdminClient();

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

        const { error } = await supabase
            .from('idempotency_keys')
            .insert([{
                key,
                response,
                expires_at: expiresAt.toISOString(),
            }]);

        if (error) {
            console.error('Error saving idempotency key:', error);
        }
    } catch (error) {
        console.error('Error in saveIdempotency:', error);
    }
}
