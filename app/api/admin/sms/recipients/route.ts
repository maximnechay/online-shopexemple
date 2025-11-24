// app/api/admin/sms/recipients/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const recipients: Array<{
            phone: string;
            name?: string;
            source: 'profile' | 'newsletter';
        }> = [];

        // 1. Получаем пользователей с включенной рассылкой из profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('full_name, phone')
            .eq('newsletter_enabled', true)
            .not('phone', 'is', null);

        if (profilesError) {
            console.error('Error loading profiles:', profilesError);
        } else if (profiles) {
            profiles.forEach((profile) => {
                if (profile.phone) {
                    recipients.push({
                        phone: profile.phone,
                        name: profile.full_name || undefined,
                        source: 'profile',
                    });
                }
            });
        }

        // 2. Получаем подписчиков из newsletter_subscribers (если у них есть телефон)
        // Примечание: В текущей схеме newsletter_subscribers хранит только email
        // Если вам нужны телефоны из newsletter, нужно добавить поле phone в таблицу

        console.log(`✅ Found ${recipients.length} SMS recipients`);

        // Удаляем дубликаты по номеру телефона
        const uniqueRecipients = recipients.reduce((acc, curr) => {
            const exists = acc.find((r) => r.phone === curr.phone);
            if (!exists) {
                acc.push(curr);
            }
            return acc;
        }, [] as typeof recipients);

        return NextResponse.json({
            success: true,
            recipients: uniqueRecipients,
            count: uniqueRecipients.length,
        });
    } catch (error) {
        console.error('❌ Error in SMS recipients API:', error);
        return NextResponse.json(
            { error: 'Fehler beim Laden der Empfänger' },
            { status: 500 }
        );
    }
}
