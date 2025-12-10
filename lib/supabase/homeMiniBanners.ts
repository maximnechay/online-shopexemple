import { createClient } from './client';
import type { HomeMiniBanner } from '../types/miniBanner';

export async function fetchActiveHomeMiniBanners(
    limit = 3
): Promise<HomeMiniBanner[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('home_mini_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('❌ Error loading mini banners:', error);
        return [];
    }

    if (!data) return [];

    return data.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        linkUrl: row.link_url,
        sortOrder: row.sort_order ?? 0,
        isActive: row.is_active,
    }));
}
