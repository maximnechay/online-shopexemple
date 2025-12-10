import { createClient } from './client';
import type { HomeBanner } from '../types/banner';

export async function fetchActiveHomeBanner(): Promise<HomeBanner | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ Error loading home banner:', error);
        return null;
    }

    if (!data || data.length === 0) return null;

    const row = data[0];

    return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        description: row.description, // ← добавили
        buttonText: row.button_text,
        buttonUrl: row.button_url,
        desktopImageUrl: row.desktop_image_url,
        mobileImageUrl: row.mobile_image_url,
        isActive: row.is_active,
    };
}
