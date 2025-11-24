import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// Используем service role для обхода RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    // Rate limiting - 5 requests per hour
    const rateLimitResult = rateLimit(request, RATE_LIMITS.newsletter);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'E-Mail ist erforderlich' },
                { status: 400 }
            );
        }

        console.log('🔴 Unsubscribe request for:', email);

        // 1. Отписываем из profiles
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .update({ newsletter_enabled: false })
            .eq('email', email)
            .select();

        if (profileError) {
            console.error('Profile update error:', profileError);
        } else {
            console.log('✅ Profile updated:', profileData?.length || 0, 'rows');
        }

        // 2. Удаляем из newsletter_subscribers
        const { data: subscriberData, error: subscriberError } = await supabase
            .from('newsletter_subscribers')
            .delete()
            .eq('email', email)
            .select();

        if (subscriberError) {
            console.error('Subscriber delete error:', subscriberError);
        } else {
            console.log('✅ Subscriber deleted:', subscriberData?.length || 0, 'rows');
        }

        // Если хотя бы одна операция успешна
        if ((profileData && profileData.length > 0) || (subscriberData && subscriberData.length > 0)) {
            return NextResponse.json({
                success: true,
                message: 'Erfolgreich abgemeldet',
                updated: {
                    profiles: profileData?.length || 0,
                    subscribers: subscriberData?.length || 0
                }
            });
        }

        // Если ничего не найдено
        return NextResponse.json(
            { error: 'E-Mail nicht gefunden in der Datenbank' },
            { status: 404 }
        );

    } catch (error) {
        console.error('❌ Unsubscribe API error:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        );
    }
}
