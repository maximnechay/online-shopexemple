import { createClient } from './client';
import type { Category } from '../types/category';

export async function fetchCategories(): Promise<Category[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('❌ Error loading categories:', error);
        return [];
    }

    return (data || []) as Category[];
}
