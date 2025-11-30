import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.newsletter);
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
        const { newsletter_enabled } = await request.json();

        // Validation
        if (typeof newsletter_enabled !== 'boolean') {
            return NextResponse.json(
                { error: 'Invalid newsletter_enabled value' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Получаем текущего пользователя
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Nicht authentifiziert' },
                { status: 401 }
            );
        }

        // Обновляем статус подписки
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ newsletter_enabled })
            .eq('id', user.id);

        if (updateError) {
            console.error('Newsletter toggle error:', updateError);
            return NextResponse.json(
                { error: 'Fehler beim Aktualisieren' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            newsletter_enabled
        });
    } catch (error) {
        console.error('Newsletter API error:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler' },
            { status: 500 }
        );
    }
}
