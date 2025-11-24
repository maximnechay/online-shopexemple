import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Получаем пользователей с включенной рассылкой
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('newsletter_enabled', true);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
        }

        // Получаем подписчиков newsletter
        const { data: newsletterSubs, error: newsletterError } = await supabase
            .from('newsletter_subscribers')
            .select('email');

        if (newsletterError) {
            console.error('Error fetching newsletter subscribers:', newsletterError);
        }

        // Объединяем и убираем дубликаты
        const recipients = new Map();

        // Добавляем из профилей
        profiles?.forEach((profile: { email: string; full_name: string | null }) => {
            if (profile.email) {
                recipients.set(profile.email, {
                    email: profile.email,
                    name: profile.full_name,
                    source: 'profile',
                });
            }
        });

        // Добавляем из newsletter (только уникальные)
        newsletterSubs?.forEach((sub: { email: string }) => {
            if (sub.email && !recipients.has(sub.email)) {
                recipients.set(sub.email, {
                    email: sub.email,
                    name: null,
                    source: 'newsletter',
                });
            }
        });

        const recipientsList = Array.from(recipients.values());

        console.log(`📧 Found ${recipientsList.length} unique email recipients`);
        console.log(`   Profiles: ${profiles?.length || 0}`);
        console.log(`   Newsletter: ${newsletterSubs?.length || 0}`);

        return NextResponse.json({
            success: true,
            recipients: recipientsList,
            count: recipientsList.length,
        });
    } catch (error) {
        console.error('Error in recipients API:', error);
        return NextResponse.json(
            { error: 'Fehler beim Laden der Empfänger' },
            { status: 500 }
        );
    }
}
