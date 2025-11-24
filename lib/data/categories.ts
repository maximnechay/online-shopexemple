// lib/data/categories.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
}

// Дефолтные категории (fallback, если БД недоступна)
export const defaultCategories: Category[] = [
    {
        id: 'hair-care',
        name: 'Haarpflege',
        slug: 'haarpflege',
        description: 'Shampoos, Conditioner, Masken und Stylingprodukte',
        image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=400&fit=crop'
    },
    {
        id: 'face-care',
        name: 'Gesichtspflege',
        slug: 'gesichtspflege',
        description: 'Cremes, Seren, Reinigung und Masken',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop'
    },
    {
        id: 'body-care',
        name: 'Körperpflege',
        slug: 'koerperpflege',
        description: 'Bodylotions, Peelings, Öle und Duschgels',
        image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&h=400&fit=crop'
    },
    {
        id: 'makeup',
        name: 'Make-up',
        slug: 'makeup',
        description: 'Foundation, Lippenstifte, Mascara und mehr',
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=400&fit=crop'
    },
    {
        id: 'tools',
        name: 'Tools & Zubehör',
        slug: 'tools',
        description: 'Pinsel, Schwämme und Beauty-Tools',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop'
    },
    {
        id: 'nails',
        name: 'Nagelpflege',
        slug: 'nagelpflege',
        description: 'Nagellacke, Pflege und Nail-Art',
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop'
    }
];

/**
 * Получить все категории из базы данных
 * Если БД недоступна, вернёт дефолтные категории
 */
export async function getCategories(): Promise<Category[]> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching categories from DB:', error);
            return defaultCategories;
        }

        // Если в БД нет категорий, вернём дефолтные
        if (!data || data.length === 0) {
            return defaultCategories;
        }

        return data;
    } catch (error) {
        console.error('Error in getCategories:', error);
        return defaultCategories;
    }
}

/**
 * Получить категорию по ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
    const categories = await getCategories();
    return categories.find(cat => cat.id === id) || null;
}

/**
 * Получить категорию по slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await getCategories();
    return categories.find(cat => cat.slug === slug) || null;
}
